import { Queue } from "bullmq";

const connection = {
  host: "127.0.0.1", // or "redis" if running inside docker network
  port: 6379,
};

// Create a queue named 'video-transcoding'
export const videoQueue = new Queue("video-transcoding", { connection });