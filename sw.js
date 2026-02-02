const CACHE_NAME = 'style-sync-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/services/geminiService.ts',
  '/services/catalogService.ts',
  '/services/wardrobeService.ts',
  '/components/StepIndicator.tsx',
  '/components/UploadStep.tsx',
  '/components/ModelGenerationStep.tsx',
  '/components/MeasurementsStep.tsx',
  '/components/GarmentSelectionStep.tsx',
  '/components/ResultsStep.tsx',
  '/components/GarmentTypeSelectionStep.tsx',
  '/components/BrandSelectionStep.tsx',
  '/components/CameraCapture.tsx',
  '/components/Logo.tsx',
  '/components/Tutorial.tsx',
  '/components/PoseGuide.tsx',
  '/components/WardrobePage.tsx',
  '/components/Compare.tsx',
  '/components/admin/AdminPage.tsx',
  '/components/admin/LoginPage.tsx',
  '/components/admin/GarmentList.tsx',
  '/components/admin/GarmentForm.tsx',
  '/components/icons/ArrowLeftIcon.tsx',
  '/components/icons/ArrowRightIcon.tsx',
  '/components/icons/SparklesIcon.tsx',
  '/components/icons/CheckCircleIcon.tsx',
  '/components/icons/UploadIcon.tsx',
  '/components/icons/CameraIcon.tsx',
  '/components/icons/HeightIcon.tsx',
  '/components/icons/WeightIcon.tsx',
  '/components/icons/ChestIcon.tsx',
  '/components/icons/WaistIcon.tsx',
  '/components/icons/ShirtIcon.tsx',
  '/components/icons/PantsIcon.tsx',
  '/components/icons/PoseGuideIcon.tsx',
  '/components/icons/RefreshIcon.tsx',
  '/components/icons/SaveIcon.tsx',
  '/components/icons/TrashIcon.tsx',
  '/components/icons/CheckIcon.tsx',
  '/components/icons/WardrobeIcon.tsx',
  '/components/icons/FrontViewIcon.tsx',
  '/components/icons/SideViewIcon.tsx',
  '/components/icons/ThreeQuarterViewIcon.tsx',
  '/components/icons/SliderHandleIcon.tsx',
  '/manifest.json',
  '/icon.svg',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});