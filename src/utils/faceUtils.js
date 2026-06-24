import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export const loadFaceModels = async () => {
  if (modelsLoaded) return true;
  
  try {
    const MODEL_URL = '/models';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log('✅ Face-API models loaded');
    return true;
  } catch (err) {
    console.error('Failed to load face-api models:', err);
    return false;
  }
};

export const detectFace = async (videoElement) => {
  if (!videoElement) return null;
  
  const detection = await faceapi
    .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  return detection || null;
};

export const detectAllFaces = async (videoElement) => {
  if (!videoElement) return [];
  
  const detections = await faceapi
    .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptors();
  
  return detections || [];
};

export const getDescriptorArray = (detection) => {
  if (!detection || !detection.descriptor) return null;
  return Array.from(detection.descriptor);
};

export const euclideanDistance = (a, b) => {
  if (!a || !b || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
};

export const drawFaceDetection = (canvas, videoElement, detection) => {
  if (!canvas || !detection) return;
  
  const dims = faceapi.matchDimensions(canvas, videoElement, true);
  const resized = faceapi.resizeResults(detection, dims);
  
  faceapi.draw.drawDetections(canvas, resized);
  faceapi.draw.drawFaceLandmarks(canvas, resized);
};

export { faceapi };
