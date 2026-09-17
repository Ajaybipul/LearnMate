import Course from "../models/Course.js";
import VideoJob from "../models/VideoJob.js";
import { planScenes, estimateCost, startClipGeneration, pollClipOperation, streamClipToResponse, CONFIG } from "../services/veoService.js";

// POST /api/ai/video/estimate  body: { courseId, lessonIndex, targetMinutes? }
// Returns a cost/time estimate WITHOUT starting any generation - shown to the instructor before they confirm.
export const estimateVideo = async (req, res, next) => {
  try {
    const { targetMinutes } = req.body;
    const minutes = targetMinutes || 2;
    const clipCount = Math.min(CONFIG.MAX_CLIPS, Math.max(4, Math.round((minutes * 60) / CONFIG.CLIP_SECONDS)));
    const estimate = estimateCost(clipCount);
    res.json({
      ...estimate,
      note:
        clipCount >= CONFIG.MAX_CLIPS
          ? `Capped at ${CONFIG.MAX_CLIPS} clips (~${Math.round((CONFIG.MAX_CLIPS * CONFIG.CLIP_SECONDS) / 60)} min) - Veo's realistic chaining ceiling.`
          : undefined,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/video/generate  body: { courseId, lessonIndex, targetMinutes? }
// Explicit, opt-in action. Plans scenes, kicks off clip generation jobs, returns a jobId to poll.
export const generateVideo = async (req, res, next) => {
  try {
    const { courseId, lessonIndex, targetMinutes } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    const lesson = course.lessons[lessonIndex];
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const scenes = await planScenes(lesson.title, lesson.content, targetMinutes || 2);
    const { estimatedCostUsd } = estimateCost(scenes.length);

    const job = await VideoJob.create({
      course: courseId,
      lessonIndex,
      requestedBy: req.user._id,
      status: "generating",
      estimatedCostUsd,
      clips: scenes.map((prompt, i) => ({ index: i, prompt, status: "pending" })),
    });

    lesson.videoStatus = "generating";
    lesson.videoJobId = job._id;
    await course.save();

    // Kick off all clip generations. Each returns an operation name to poll later.
    for (const clip of job.clips) {
      try {
        const operationName = await startClipGeneration(clip.prompt);
        clip.operationName = operationName;
        clip.status = "generating";
      } catch (err) {
        console.error(`[video generation] clip ${clip.index} failed to start:`, err.message);
        clip.status = "failed";
        clip.error = err.message;
      }
    }
    await job.save();

    res.status(202).json({ jobId: job._id, clipCount: job.clips.length, estimatedCostUsd });
  } catch (err) {
    // Roll back lesson status so the UI doesn't get stuck showing "generating" forever
    try {
      const course = await Course.findById(req.body.courseId);
      const lesson = course?.lessons?.[req.body.lessonIndex];
      if (lesson) {
        lesson.videoStatus = "failed";
        await course.save();
      }
    } catch {}
    next(err);
  }
};

// GET /api/ai/video/status/:jobId - polls every non-final clip, updates DB, returns current state
export const getVideoStatus = async (req, res, next) => {
  try {
    const job = await VideoJob.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    for (const clip of job.clips) {
      if (clip.status !== "generating" || !clip.operationName) continue;
      try {
        const result = await pollClipOperation(clip.operationName);
        if (result.done) {
          if (result.error) {
            console.error(`[video generation] clip ${clip.index} failed:`, result.error);
            clip.status = "failed";
            clip.error = result.error;
          } else {
            clip.status = "ready";
            clip.fileUri = result.fileUri;
          }
        }
      } catch (err) {
        console.error(`[video generation] clip ${clip.index} poll error:`, err.message);
        clip.status = "failed";
        clip.error = err.message;
      }
    }

    const allDone = job.clips.every((c) => c.status === "ready" || c.status === "failed");
    const anyFailed = job.clips.some((c) => c.status === "failed");
    const anyReady = job.clips.some((c) => c.status === "ready");

    if (allDone) {
      job.status = anyReady ? "ready" : "failed";
      if (!anyReady) {
        const firstError = job.clips.find((c) => c.status === "failed" && c.error)?.error;
        job.error = firstError || "All clips failed to generate";
      }
    }
    await job.save();

    // Reflect status onto the lesson once we have a final outcome
    if (allDone) {
      const course = await Course.findById(job.course);
      const lesson = course?.lessons?.[job.lessonIndex];
      if (lesson) {
        lesson.videoStatus = job.status === "ready" ? "ready" : "failed";
        await course.save();
      }
    }

    res.json({
      jobId: job._id,
      status: job.status,
      clips: job.clips.map((c) => ({ index: c.index, status: c.status, error: c.error || undefined })),
      readyClipCount: job.clips.filter((c) => c.status === "ready").length,
      totalClips: job.clips.length,
      anyFailed,
      error: job.status === "failed" ? job.error : undefined,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/ai/video/stream/:jobId/:clipIndex - proxies the actual video bytes for one clip
export const streamClip = async (req, res, next) => {
  try {
    const job = await VideoJob.findById(req.params.jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    const clip = job.clips[Number(req.params.clipIndex)];
    if (!clip || clip.status !== "ready" || !clip.fileUri) {
      return res.status(404).json({ message: "Clip not ready" });
    }
    await streamClipToResponse(clip.fileUri, res);
  } catch (err) {
    next(err);
  }
};