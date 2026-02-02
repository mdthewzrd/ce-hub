'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

// Define types inline for now
interface UploadedFile {
  id: string;
  name: string;
  type: 'subject' | 'glasses';
  url: string;
  size: number;
  width?: number;
  height?: number;
}

interface Task {
  id: string;
  jobId: string;
  subjectFile: UploadedFile;
  glassesFiles: UploadedFile[];
  status: 'queued' | 'running' | 'verifying' | 'completed' | 'failed';
  progress: number;
  result?: {
    imageUrl: string;
    reportUrl: string;
    editReport: any;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Job {
  id: string;
  tasks: Task[];
  status: 'queued' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  glassesFiles: UploadedFile[];
  createdAt: Date;
  updatedAt: Date;
  sizingInfo?: {
    brand: string;
    sizeChartUrl: string;
    exact?: {
      model: string;
      frame: string;
      lensWidth: string;
      lensHeight: string;
      bridge: string;
      temple: string;
      frameWidth: string;
    };
    sizes: {
      small: { lensWidth: string; bridge: string; temple: string; faceWidth: string };
      medium: { lensWidth: string; bridge: string; temple: string; faceWidth: string };
      large: { lensWidth: string; bridge: string; temple: string; faceWidth: string };
    };
    fittingGuide: string;
  };
  results?: any[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string; // For result images
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectSubjectPhotos, setProjectSubjectPhotos] = useState<any[]>([]);
  const [selectedSubjectPhoto, setSelectedSubjectPhoto] = useState<any | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectSizingUrl, setNewProjectSizingUrl] = useState('');
  // Manual measurement inputs
  const [newProjectModel, setNewProjectModel] = useState('');
  const [newProjectFrame, setNewProjectFrame] = useState('');
  const [newProjectLensWidth, setNewProjectLensWidth] = useState('');
  const [newProjectLensHeight, setNewProjectLensHeight] = useState('');
  const [newProjectBridge, setNewProjectBridge] = useState('');
  const [newProjectTemple, setNewProjectTemple] = useState('');
  const [newProjectFrameWidth, setNewProjectFrameWidth] = useState('');
  const [subjectFiles, setSubjectFiles] = useState<File[]>([]);
  const [glassesFiles, setGlassesFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showBefore, setShowBefore] = useState(true);
  const [expandedProjectResults, setExpandedProjectResults] = useState<Set<string>>(new Set());
  const [showPrompt, setShowPrompt] = useState(true);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [geminiMessages, setGeminiMessages] = useState<ChatMessage[]>([]);
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingResult, setEditingResult] = useState<any>(null);
  const [editGuidance, setEditGuidance] = useState(0.6);
  const [editRefStrength, setEditRefStrength] = useState(0.85);
  const [editLightingWeight, setEditLightingWeight] = useState(0.7);
  const [editReflectionWeight, setEditReflectionWeight] = useState(0.8);
  const [editColorMatchWeight, setEditColorMatchWeight] = useState(0.15);
  // Edit request modal state
  const [showEditRequestModal, setShowEditRequestModal] = useState(false);
  const [editRequestText, setEditRequestText] = useState('');
  const [requestingEditFor, setRequestingEditFor] = useState<any>(null);
  // Replacement subject file for edits (when original is missing)
  const [editSubjectFile, setEditSubjectFile] = useState<File | null>(null);
  // Lightbox modal state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxResults, setLightboxResults] = useState<any[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number>(0);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Real-time job progress polling
  useEffect(() => {
    if (!currentJob || currentJob.status === 'completed' || currentJob.status === 'failed') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs?jobId=${currentJob.id}`);
        if (response.ok) {
          const updatedJob = await response.json();
          const previousJob = currentJob;
          setCurrentJob(updatedJob);

          // Check for newly completed tasks and add results to Gemini chat
          if (previousJob) {
            updatedJob.tasks.forEach(updatedTask => {
              const previousTask = previousJob.tasks.find(t => t.id === updatedTask.id);

              // If this task just completed and has a result, add to Gemini chat
              if (
                updatedTask.status === 'completed' &&
                updatedTask.result &&
                (!previousTask || previousTask.status !== 'completed')
              ) {
                const resultMessage: ChatMessage = {
                  id: (Date.now()).toString(),
                  role: 'assistant',
                  content: `✅ **Try-On Complete!**

I've successfully processed your photo and added the glasses. Here's your result:

**Quality Metrics:**
- SSIM: ${updatedTask.result.editReport?.quality?.ssim?.toFixed(3) || 'N/A'}
- Face Distance: ${updatedTask.result.editReport?.quality?.faceDist?.toFixed(3) || 'N/A'}
- Status: ${updatedTask.result.editReport?.quality?.fit || 'pass'}

**Notes:** ${updatedTask.result.editReport?.notes || 'Glasses applied successfully!'}

Click the image below to view/download your result:`,
                  timestamp: new Date(),
                  imageUrl: updatedTask.result.imageUrl
                };

                setGeminiMessages(prev => [...prev, resultMessage]);

                // Auto-save result to project
                saveResultToProject(updatedTask);
              }
            });
          }

          // If job is completed, stop polling
          if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error('Failed to poll job status:', error);
      }
    }, 1000); // Poll every second for smooth updates

    return () => clearInterval(pollInterval);
  }, [currentJob?.id, currentJob?.status]);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadProjectSubjectPhotos = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/subject-photos`);
      if (response.ok) {
        const photos = await response.json();
        setProjectSubjectPhotos(photos);
        console.log(`Loaded ${photos.length} subject photos for project`);
      }
    } catch (error) {
      console.error('Failed to load project subject photos:', error);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim() || glassesFiles.length === 0) {
      console.log('Please enter a project name and upload at least one glasses photo');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', newProjectName);
      if (newProjectSizingUrl.trim()) {
        formData.append('sizingUrl', newProjectSizingUrl.trim());
      }

      // Add manual measurements if provided
      if (newProjectModel.trim()) {
        formData.append('model', newProjectModel.trim());
      }
      if (newProjectFrame.trim()) {
        formData.append('frame', newProjectFrame.trim());
      }
      if (newProjectLensWidth.trim()) {
        formData.append('lensWidth', newProjectLensWidth.trim());
      }
      if (newProjectLensHeight.trim()) {
        formData.append('lensHeight', newProjectLensHeight.trim());
      }
      if (newProjectBridge.trim()) {
        formData.append('bridge', newProjectBridge.trim());
      }
      if (newProjectTemple.trim()) {
        formData.append('temple', newProjectTemple.trim());
      }
      if (newProjectFrameWidth.trim()) {
        formData.append('frameWidth', newProjectFrameWidth.trim());
      }

      glassesFiles.forEach((file) => {
        formData.append('glasses', file);
      });

      const response = await fetch('/api/projects', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects(prev => [newProject, ...prev]);
        setCurrentProject(newProject);
        setShowProjectModal(false);
        setNewProjectName('');
        setNewProjectSizingUrl('');
        setNewProjectModel('');
        setNewProjectFrame('');
        setNewProjectLensWidth('');
        setNewProjectLensHeight('');
        setNewProjectBridge('');
        setNewProjectTemple('');
        setNewProjectFrameWidth('');
        setGlassesFiles([]);
        console.log('Project created successfully!');
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      console.error('Failed to create project');
    }
  };

  const deleteProject = async (projectId: string, projectName: string) => {
    console.log(`Deleting project: ${projectName}`);

    try {
      const response = await fetch(`/api/projects?projectId=${projectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== projectId));

        // If the deleted project was the current project, clear it
        if (currentProject?.id === projectId) {
          setCurrentProject(null);
        }

        console.log('Project deleted successfully!');
      } else {
        const error = await response.json();
        console.error(`Failed to delete project: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      console.error('Failed to delete project');
    }
  };

  const onDropSubject = useCallback((acceptedFiles: File[]) => {
    setSubjectFiles(prev => [...prev, ...acceptedFiles].slice(0, 10));
  }, []);

  const onDropGlasses = useCallback((acceptedFiles: File[]) => {
    setGlassesFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const removeFile = (type: 'subject' | 'glasses', index: number) => {
    if (type === 'subject') {
      setSubjectFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setGlassesFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const moveGlasses = (fromIndex: number, direction: 'up' | 'down') => {
    setGlassesFiles(prev => {
      const newFiles = [...prev];
      const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;

      if (toIndex < 0 || toIndex >= newFiles.length) return prev;

      // Swap
      [newFiles[fromIndex], newFiles[toIndex]] = [newFiles[toIndex], newFiles[fromIndex]];
      return newFiles;
    });
  };

  const moveProjectGlasses = async (projectId: string, fromIndex: number, direction: 'up' | 'down') => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const glassesList = deduplicateGlasses(project.glassesFiles);
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;

    if (toIndex < 0 || toIndex >= glassesList.length) return;

    // Create new array with swapped items
    const newGlassesFiles = [...project.glassesFiles];
    [newGlassesFiles[fromIndex], newGlassesFiles[toIndex]] = [newGlassesFiles[toIndex], newGlassesFiles[fromIndex]];

    // Update project locally
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, glassesFiles: newGlassesFiles } : p
    ));

    // Save to backend
    try {
      const response = await fetch(`/api/projects/${projectId}/glasses-order`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ glassesFiles: newGlassesFiles })
      });

      if (!response.ok) {
        console.error('Failed to save glasses order');
      }
    } catch (error) {
      console.error('Failed to save glasses order:', error);
    }
  };

  const deleteProjectGlasses = async (projectId: string, fileIndex: number, fileName: string) => {
    console.log(`Deleting glasses file: ${fileName}`);

    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newGlassesFiles = project.glassesFiles.filter((_, i) => i !== fileIndex);

    // Update project locally
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, glassesFiles: newGlassesFiles } : p
    ));

    // Save to backend
    try {
      const response = await fetch(`/api/projects/${projectId}/glasses`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIndex, fileName })
      });

      if (!response.ok) {
        console.error('Failed to delete glasses');
      } else {
        console.log('Glasses deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete glasses:', error);
    }
  };

  // Save a completed task result to its project
  const saveResultToProject = async (task: Task) => {
    if (!task.result || !currentProject) {
      console.log('No project selected or no result to save');
      return;
    }

    try {
      const response = await fetch(`/api/projects/${currentProject.id}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          jobId: task.jobId,
          subjectFile: task.subjectFile,
          glassesFiles: task.glassesFiles,
          imageUrl: task.result.imageUrl,
          editReport: task.result.editReport,
          params: task.params
        })
      });

      if (response.ok) {
        console.log('Result saved to project');
        // Reload projects to get updated results
        await loadProjects();
        console.log('Result saved to project! Check the project card to see it.');
      } else {
        const error = await response.json();
        console.error(`Failed to save: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to save result:', error);
      console.error('Failed to save result. Please try again.');
    }
  };

  // Open edit modal for a result
  const openEditModal = (result: any) => {
    setEditingResult(result);
    setEditGuidance(result.params?.guidance || 0.6);
    setEditRefStrength(result.params?.refStrength || 0.85);
    setEditLightingWeight(result.params?.lightingWeight || 0.7);
    setEditReflectionWeight(result.params?.reflectionWeight || 0.8);
    setEditColorMatchWeight(result.params?.colorMatchWeight || 0.15);
    setShowEditModal(true);
  };

  // Re-run with edited parameters
  const handleRerun = async () => {
    if (!editingResult || !currentProject) return;

    const newParams = {
      guidance: editGuidance,
      refStrength: editRefStrength,
      lightingWeight: editLightingWeight,
      reflectionWeight: editReflectionWeight,
      colorMatchWeight: editColorMatchWeight,
      seed: Math.floor(Math.random() * 1000000)
    };

    // Use replacement subject file if provided, otherwise use original
    const subjectFileToUse = editSubjectFile ? {
      name: editSubjectFile.name,
      url: URL.createObjectURL(editSubjectFile),
      file: editSubjectFile
    } : editingResult.subjectFile;

    // Create new job with the same subject/glasses but new params
    await handleUploadWithParams(
      subjectFileToUse,
      editingResult.glassesFiles,
      newParams
    );

    setShowEditModal(false);
    setEditingResult(null);
    setEditSubjectFile(null);
  };

  // Open edit request modal
  const openEditRequestModal = async (task: any) => {
    setRequestingEditFor(task);
    setEditRequestText('');
    setSelectedSubjectPhoto(null);

    // Find the project this result belongs to and load its subject photos
    let resultProjectId = task.projectId;

    // If no projectId on task, check the result object
    if (!resultProjectId && task.result?.projectId) {
      resultProjectId = task.result.projectId;
    }

    // If still no projectId, try to find the project by matching the result
    if (!resultProjectId) {
      const foundProject = projects.find(p =>
        p.results?.some((r: any) => r.taskId === task.taskId || r.imageUrl === task.result?.imageUrl)
      );
      if (foundProject) {
        resultProjectId = foundProject.id;
      }
    }

    if (resultProjectId) {
      const resultProject = projects.find(p => p.id === resultProjectId);
      if (resultProject) {
        setCurrentProject(resultProject);
        await loadProjectSubjectPhotos(resultProjectId);
      }
    }

    setShowEditRequestModal(true);
  };

  // Submit edit request
  const handleSubmitEditRequest = async () => {
    if (!editRequestText.trim() || !requestingEditFor || !currentProject) return;

    // Add edit request to Gemini chat for visibility
    const requestMessage: ChatMessage = {
      id: (Date.now()).toString(),
      role: 'user',
      content: `📝 **Edit Request for Result ${requestingEditFor.id.slice(0, 8)}**

${editRequestText}

Regenerating with your requested changes...`,
      timestamp: new Date()
    };

    setGeminiMessages(prev => [...prev, requestMessage]);
    setShowEditRequestModal(false);

    // Get the original parameters
    const originalParams = requestingEditFor.params || requestingEditFor.editReport?.generation || {
      guidance: 0.6,
      refStrength: 0.85,
      lightingWeight: 0.7,
      reflectionWeight: 0.8,
      colorMatchWeight: 0.15,
      seed: Math.floor(Math.random() * 1000000)
    };

    // Create new job with edit request
    try {
      setIsUploading(true);
      setUploadProgress(20);

      let subjectFileObj: File;

      // Use replacement subject file if provided, otherwise try to fetch original
      if (selectedSubjectPhoto) {
        // Use selected project subject photo
        console.log('Using selected project subject photo:', selectedSubjectPhoto.name);

        const fullUrl = selectedSubjectPhoto.url.startsWith('http')
          ? selectedSubjectPhoto.url
          : `${window.location.origin}${selectedSubjectPhoto.url}`;

        const response = await fetch(fullUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch selected subject photo');
        }

        const blob = await response.blob();
        subjectFileObj = new File([blob], selectedSubjectPhoto.name, { type: 'image/jpeg' });
      } else if (editSubjectFile) {
        console.log('Using replacement subject file:', editSubjectFile.name);
        subjectFileObj = editSubjectFile;
      } else {
        // Debug: log what we're working with
        console.log('Edit request subject file:', requestingEditFor.subjectFile);

        // Use full URL for fetching the subject file
        const fullUrl = requestingEditFor.subjectFile.url.startsWith('http')
          ? requestingEditFor.subjectFile.url
          : `${window.location.origin}${requestingEditFor.subjectFile.url}`;

        console.log('Fetching subject from:', fullUrl);

        const response = await fetch(fullUrl);
        if (!response.ok) {
          console.error('Failed to fetch subject. Status:', response.status, 'URL:', fullUrl);
          throw new Error(`Original subject image not found. Please use the file upload option in the edit modal and try again.`);
        }

        const blob = await response.blob();
        subjectFileObj = new File(
          [blob],
          requestingEditFor.subjectFile.name,
          { type: 'image/jpeg' }
        );
      }

      setUploadProgress(40);

      // Create FormData for job submission (/api/jobs expects FormData, not JSON)
      const jobFormData = new FormData();
      jobFormData.append('subjects', subjectFileObj);
      jobFormData.append('projectId', currentProject.id);

      // Add generation parameters as JSON string
      const jobParams = {
        ...originalParams,
        seed: Math.floor(Math.random() * 1000000),
        editRequest: editRequestText
      };
      jobFormData.append('params', JSON.stringify(jobParams));

      setUploadProgress(60);

      // Create job directly with FormData (glasses will be loaded from project)
      const jobResponse = await fetch('/api/jobs', {
        method: 'POST',
        body: jobFormData  // No Content-Type header - browser sets it with boundary for FormData
      });

      if (!jobResponse.ok) {
        const errorText = await jobResponse.text();
        console.error('Job creation failed:', errorText);
        throw new Error(`Failed to create job: ${errorText}`);
      }

      setUploadProgress(80);

      const job = await jobResponse.json();
      const newJob: Job = {
        id: job.id,
        tasks: job.tasks || [],
        status: job.status || 'queued',
        createdAt: new Date(job.createdAt || Date.now()),
        updatedAt: new Date(job.updatedAt || Date.now()),
        projectId: currentProject.id
      };

      setJobs(prev => [newJob, ...prev]);
      setCurrentJob(newJob);

      setUploadProgress(100);

      // Add success message to chat
      const successMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `✅ **Edit Request Submitted!**

I'm regenerating your try-on with the following changes:
"${editRequestText}"

This may take a minute. You'll see the result appear in the "Current Job Status" section above.`,
        timestamp: new Date()
      };

      setGeminiMessages(prev => [...prev, successMessage]);

    } catch (error) {
      console.error('Edit request error:', error);

      // Check if it's the original subject not found error
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('Original subject image not found') || errorMessage.includes('Failed to fetch subject')) {
        console.warn('⚠️ The original subject photo is no longer available.\n\nPlease click "Request Edit" again and use the file upload option in the modal to provide your subject photo, then try again.');
      } else {
        console.error(`Failed to submit edit request: ${errorMessage}\n\nPlease try again or contact support if the issue persists.`);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setEditRequestText('');
      setRequestingEditFor(null);
      setEditSubjectFile(null);
      setSelectedSubjectPhoto(null);
    }
  };

  // Upload with custom parameters (for re-running)
  const handleUploadWithParams = async (subjectFile: any, glassesFiles: any[], params: any) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      setUploadProgress(20);

      // Debug: log what we're working with
      console.log('Edit subject file:', subjectFile);

      // Create form data for subject upload
      const subjectFormData = new FormData();

      let subjectFileObj: File;

      // Check if this is a replacement file (has .file property) or original (needs fetching)
      if (subjectFile.file) {
        console.log('Using replacement subject file:', subjectFile.file.name);
        subjectFileObj = subjectFile.file;
      } else {
        // Use full URL for fetching the subject file
        const fullUrl = subjectFile.url.startsWith('http')
          ? subjectFile.url
          : `${window.location.origin}${subjectFile.url}`;

        console.log('Fetching subject from:', fullUrl);

        const response = await fetch(fullUrl);
        if (!response.ok) {
          console.error('Failed to fetch subject. Status:', response.status, 'URL:', fullUrl);
          throw new Error(`Original subject image not found. Please use the file upload option in the edit modal and try again.`);
        }

        const blob = await response.blob();
        subjectFileObj = new File([blob], subjectFile.name, { type: 'image/jpeg' });
      }

      subjectFormData.append('file', subjectFileObj);

      // Upload subject
      const uploadSubjectResponse = await fetch('/api/upload', {
        method: 'POST',
        body: subjectFormData
      });

      if (!uploadSubjectResponse.ok) throw new Error('Failed to upload subject');

      setUploadProgress(40);

      const { jobId: subjectJobId } = await uploadSubjectResponse.json();
      const subjectUploadedFile: UploadedFile = {
        id: subjectJobId,
        name: subjectFileObj.name,
        type: 'subject',
        url: `/uploads/${subjectJobId}/${subjectFileObj.name}`,
        size: subjectFileObj.size || 0
      };

      setUploadProgress(60);

      // Create job
      const jobResponse = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProject?.id,
          subjectFiles: [subjectUploadedFile],
          glassesFiles: glassesFiles,
          params: params
        })
      });

      if (!jobResponse.ok) throw new Error('Failed to create job');

      setUploadProgress(80);

      const { jobId } = await jobResponse.json();
      const newJob: Job = {
        id: jobId,
        tasks: [],
        status: 'queued',
        createdAt: new Date(),
        updatedAt: new Date(),
        projectId: currentProject?.id
      };

      setJobs(prev => [...prev, newJob]);
      setCurrentJob(newJob);

      setUploadProgress(100);
      setSubjectFiles([]);
      // Don't clear glassesFiles since they're from the project

      // Automatically process the job
      console.log('🔄 Starting job processing...');
      fetch('/api/process-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      }).then(response => response.json())
        .then(data => {
          console.log('✅ Job processing complete:', data);
        })
        .catch(error => {
          console.error('❌ Job processing failed:', error);
        });

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload. Please try again.';
      console.error(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const {
    getRootProps: getSubjectRootProps,
    getInputProps: getSubjectInputProps,
    isDragActive: isSubjectDragActive
  } = useDropzone({
    onDrop: onDropSubject,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 10,
    maxSize: 25 * 1024 * 1024 // 25MB
  });

  const {
    getRootProps: getGlassesRootProps,
    getInputProps: getGlassesInputProps,
    isDragActive: isGlassesDragActive
  } = useDropzone({
    onDrop: onDropGlasses,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxSize: 25 * 1024 * 1024 // 25MB
  });

  const handleUpload = async () => {
    if (subjectFiles.length === 0 || (!currentProject && glassesFiles.length === 0)) {
      console.log('Please upload subject photos and either select a project or upload glasses photos');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();

      subjectFiles.forEach((file) => {
        formData.append('subjects', file);
      });

      if (currentProject) {
        formData.append('projectId', currentProject.id);
      } else {
        glassesFiles.forEach((file) => {
          formData.append('glasses', file);
        });
      }

      const response = await fetch('/api/jobs', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const job: Job = await response.json();
      setJobs(prev => [job, ...prev]);
      setCurrentJob(job);

      // Reset form
      setSubjectFiles([]);
      if (!currentProject) {
        setGlassesFiles([]);
      }
      setUploadProgress(0);

      console.log('Upload successful! Processing started...');
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadFile = async (url: string, filename: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  };

  // Helper functions for project results
  const getProjectResults = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);

    // Get saved results from project - structure as Task objects with nested result
    const savedResults = (project?.results || []).map((r: any) => ({
      id: r.taskId,
      taskId: r.taskId,
      jobId: r.jobId,
      taskName: `Result ${r.taskId.slice(0, 8)}`,
      status: 'completed' as const,
      progress: 100,
      projectId: projectId, // Add projectId so edit modal can find the correct project
      subjectFile: r.subjectFile,
      glassesFiles: r.glassesFiles,
      params: r.params || r.editReport?.generation || {},
      // Wrap in result object to match Task structure
      result: {
        imageUrl: r.imageUrl,
        reportUrl: '',
        editReport: r.editReport
      },
      completedAt: r.completedAt,
      updatedAt: new Date(r.completedAt),
      createdAt: new Date(r.completedAt)
    }));

    // Also get results from current jobs (in memory)
    const allJobs = jobs.filter(job => job && job.projectId === projectId && job.status === 'completed');
    const jobResults = [];
    allJobs.forEach(job => {
      if (job.tasks) {
        const completedTasks = job.tasks.filter(task => task.status === 'completed' && task.result);
        completedTasks.forEach(task => {
          // Avoid duplicates by taskId
          if (!savedResults.some((r: any) => r.taskId === task.id)) {
            jobResults.push({
              id: task.id,
              taskId: task.id,
              jobId: task.jobId,
              taskName: `Task ${task.id.slice(0, 8)}`,
              status: 'completed' as const,
              progress: 100,
              subjectFile: task.subjectFile,
              glassesFiles: task.glassesFiles,
              params: task.params,
              result: {
                imageUrl: task.result.imageUrl,
                reportUrl: task.result.reportUrl,
                editReport: task.result.editReport
              },
              completedAt: task.updatedAt,
              updatedAt: task.updatedAt,
              createdAt: task.createdAt
            });
          }
        });
      }
    });

    // Combine and sort by completion date
    const combined = [...savedResults, ...jobResults];
    return combined.sort((a, b) => {
      const dateA = new Date(a.completedAt).getTime();
      const dateB = new Date(b.completedAt).getTime();
      return dateB - dateA;
    });
  };

  const toggleProjectResults = (projectId: string) => {
    setExpandedProjectResults(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  // Open lightbox with navigation support
  const openLightbox = (imageUrl: string, allResults: any[], currentIndex: number) => {
    setLightboxResults(allResults);
    setLightboxIndex(currentIndex);
    setLightboxImage(imageUrl);
  };

  // Navigate to previous image
  const goToPrevImage = () => {
    setLightboxIndex(prev => {
      const newIndex = prev > 0 ? prev - 1 : lightboxResults.length - 1;
      setLightboxImage(lightboxResults[newIndex].result?.imageUrl || lightboxResults[newIndex].imageUrl);
      return newIndex;
    });
  };

  // Navigate to next image
  const goToNextImage = () => {
    setLightboxIndex(prev => {
      const newIndex = prev < lightboxResults.length - 1 ? prev + 1 : 0;
      setLightboxImage(lightboxResults[newIndex].result?.imageUrl || lightboxResults[newIndex].imageUrl);
      return newIndex;
    });
  };

  const viewTaskResult = (task: any) => {
    setSelectedTask(task);
    setShowBefore(true);
    // Scroll to results section
    setTimeout(() => {
      const resultsSection = document.getElementById('results-section');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const deleteProjectResult = async (projectId: string, taskId: string) => {
    console.log(`Deleting result: ${taskId.slice(0, 8)}`);

    try {
      const response = await fetch(`/api/projects/${projectId}/results?taskId=${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Reload projects to update the UI
        await loadProjects();
      } else {
        console.error('Failed to delete result');
        console.error('Failed to delete result. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting result:', error);
      console.error('Error deleting result. Please try again.');
    }
  };

  // Utility function to deduplicate glasses frames by URL or unique identifier
  const deduplicateGlasses = (glassesArray: any[]) => {
    if (!glassesArray || !Array.isArray(glassesArray)) {
      return [];
    }

    const seen = new Set();
    return glassesArray.filter(glasses => {
      if (!glasses) return false;

      // Handle different data structures safely
      let identifier;
      if (glasses.url) {
        identifier = glasses.url;
      } else if (glasses.id) {
        identifier = glasses.id;
      } else if (typeof glasses === 'string') {
        identifier = glasses;
      } else if (glasses instanceof File) {
        identifier = glasses.name + glasses.size + glasses.lastModified;
      } else {
        // Fallback to stringified version
        try {
          identifier = JSON.stringify(glasses);
        } catch (e) {
          identifier = 'unknown-' + Math.random().toString(36).substr(2, 9);
        }
      }

      if (seen.has(identifier)) {
        return false;
      }
      seen.add(identifier);
      return true;
    });
  };

  // Utility function to get unique glasses frames from all tasks
  const getUniqueGlassesFromResults = (tasks: Task[]) => {
    const allGlasses = tasks.flatMap(task => task.glassesFiles || []);
    return deduplicateGlasses(allGlasses);
  };

  const generateKickassPrompt = () => {
    const prompt = `You are a world-class AI photo editor specializing in hyper-realistic virtual glasses try-on. You have MULTIPLE glasses reference photos to choose from.

🎯 CRITICAL MISSION:
- Analyze ALL glasses reference photos provided
- SELECT the best-matching glasses style for the person's face
- Create the most realistic try-on result possible
- Make it look 100% REALISTIC - like an actual photograph

🔬 FACE ANALYSIS - DO THIS FIRST:
1. Locate both eyes PRECISELY in the person's photo
2. Measure exact distance between pupils (interpupillary distance)
3. Find nose bridge position and width
4. Determine head angle, face shape, and facial proportions
5. Note skin tone, hair color, and overall style
6. Analyze lighting direction and shadows in the scene

👓 MULTIPLE GLASSES ANALYSIS - DO THIS SECOND:
For EACH glasses reference photo, analyze:
1. Frame shape, style, and size
2. Frame color, thickness, and material
3. Lens tint/color and transparency
4. Temple arm length and curve
5. Overall aesthetic and style category
6. ⭐ IMPORTANT: View angle (front-facing vs side vs angled)

🎨 INTELLIGENT GLASSES SELECTION - CRITICAL:
⚠️ PRIORITY #1: FRONT-FACING SELECTION
- ALWAYS prefer glasses shown FRONT-FACING (straight-on view)
- AVOID side-angle or profile glasses photos
- Front-facing photos show proper frame shape and lens appearance
- Side photos create incorrect placement and unrealistic results

IF MULTIPLE GLASSES ARE PROVIDED:
1. ⭐ FIRST: Identify which photos are FRONT-FACING (90% will be front-facing)
2. ⭐ SECOND: Rank glasses by view angle priority:
   - #1: Perfect front-facing view ✅
   - #2: Slightly angled front view
   - #3: Side profile view ❌ (avoid if better option exists)
   - #4: Extreme angle views (avoid completely)

3. ⭐ THIRD: From the FRONT-FACING options, choose the best match for:
   - Face shape and proportions
   - Personal style and aesthetic
   - Skin tone and hair color
   - Occasion (casual, formal, trendy, classic)

4. POSITION glasses using the FRONT-FACING reference only
5. SCALE glasses appropriately for face size
6. ALIGN glasses correctly with both eyes using the front view reference

💡 ADVANCED REALISM TECHNIQUES:
- Cast realistic shadows under frames and on nose
- Add sophisticated lens reflections matching scene lighting
- Create subtle frame highlights and lowlights
- Blend edges naturally with skin texture and tones
- Preserve original photo's lighting atmosphere
- Ensure eyes remain visible and natural through lenses
- Add authentic lens glare and light refraction
- Match metal/plastic material properties realistically

❌ CRITICAL AVOIDANCES:
- NO white backgrounds or boxes around glasses
- NO floating, detached, or misaligned glasses
- NO incorrect scale or proportions
- NO cartoonish, fake, or artificial appearance
- NO alterations to person's facial features
- NO background changes or distractions
- NO reflection of camera or photographer

🎯 MULTI-OPTION SUCCESS CRITERIA:
Generate the MOST flattering and realistic result by:
- ⭐ SELECTING FRONT-FACING glasses reference photos (PRIORITY #1)
- Placing glasses with anatomical precision using front view reference
- Creating photograph-level quality and realism
- Ensuring the result looks like a genuine portrait with proper glasses alignment
- Matching lighting and environmental conditions

🚨 FINAL REMINDER: 90% of the time, the BEST glasses reference will be the FRONT-FACING photo. Use front-facing references for proper alignment and realistic placement!

Choose the best front-facing glasses option and generate one ultra-realistic image showing the person wearing glasses naturally.`;

    setCurrentPrompt(prompt);
    return prompt;
  };

  // Initialize the prompt on component mount
  useEffect(() => {
    generateKickassPrompt();
  }, []);

  // Add Gemini message when processing starts
  useEffect(() => {
    if (currentJob && currentJob.status === 'processing') {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: currentPrompt,
        timestamp: new Date()
      };

      setGeminiMessages(prev => [...prev, userMessage]);

      // Simulate Gemini response (in real implementation, this would come from the actual API)
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I\'m analyzing the face and glasses to create a realistic try-on. Let me locate the eyes, measure distances, and place the glasses with proper shadows and reflections.',
          timestamp: new Date()
        };
        setGeminiMessages(prev => [...prev, assistantMessage]);
      }, 2000);
    }
  }, [currentJob?.status, currentPrompt]);

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !selectedTask) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');

    try {
      const response = await fetch('/api/chat/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: selectedTask.id,
          message: chatInput
        })
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">Try-On From Photo</h1>
              <span className="ml-2 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-900 rounded-full">
                Nano Banana Powered
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                className="flex items-center space-x-2 px-3 py-1 bg-muted rounded-lg hover:bg-accent transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{showPrompt ? 'Hide' : 'Show'} Prompt</span>
              </button>
              <span className="text-sm text-muted-foreground">
                AI-powered glasses try-on in seconds
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upload Section */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Create Your Try-On</h2>

              {/* Project Selection */}
              <div className="bg-card rounded-lg shadow-sm border p-6 mb-6">
                <h3 className="text-lg font-medium mb-4">Project Selection</h3>
                {currentProject ? (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{currentProject.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {currentProject.glassesFiles.length} glasses photos
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentProject(null)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center text-muted-foreground py-8">
                      <p>No project selected</p>
                      <p className="text-sm">Create a new project or upload glasses photos directly</p>
                    </div>
                    <button
                      onClick={() => setShowProjectModal(true)}
                      className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                      Create New Project
                    </button>
                  </div>
                )}
              </div>

              {/* Subject Photos Upload */}
              <div className="bg-card rounded-lg shadow-sm border p-6 mb-6">
                <h3 className="text-lg font-medium mb-4">
                  Your Photos (Subject)
                </h3>
                <div
                  {...getSubjectRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isSubjectDragActive
                      ? 'border-blue-400 bg-blue-950'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                >
                  <input {...getSubjectInputProps()} />
                  <svg className="mx-auto h-12 w-12 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-muted-foreground mb-2">
                    {isSubjectDragActive ? 'Drop photos here...' : 'Drag & drop your photos here'}
                  </p>
                  <p className="text-sm text-muted-foreground">or click to select files</p>
                  <p className="text-xs text-muted-foreground mt-2">PNG, JPG up to 25MB (max 10 photos)</p>
                </div>

                {subjectFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {subjectFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Subject ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <button
                          onClick={() => removeFile('subject', index)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b truncate">
                          {file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Glasses Photos Upload (only if no project selected) */}
              {!currentProject && (
                <div className="bg-card rounded-lg shadow-sm border p-6 mb-6">
                  <h3 className="text-lg font-medium mb-4">
                    Glasses Reference Photos
                  </h3>
                  <div
                    {...getGlassesRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isGlassesDragActive
                        ? 'border-blue-400 bg-blue-950'
                        : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                    }`}
                  >
                    <input {...getGlassesInputProps()} />
                    <svg className="mx-auto h-12 w-12 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <p className="text-muted-foreground mb-2">
                      {isGlassesDragActive ? 'Drop glasses photos here...' : 'Drag & drop glasses photos here'}
                    </p>
                    <p className="text-sm text-muted-foreground">or click to select files</p>
                    <p className="text-xs text-muted-foreground mt-2">PNG, JPG up to 25MB (unlimited photos)</p>
                  </div>

                  {glassesFiles.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">{deduplicateGlasses(glassesFiles).length} glasses photos uploaded</p>
                      <p className="text-xs text-blue-400 font-medium mb-2">Use blue arrows to reorder - First photo (marked FIRST) will be used for try-on</p>
                      <div className="grid grid-cols-4 gap-3 max-h-40 overflow-y-auto">
                        {deduplicateGlasses(glassesFiles).map((file, index) => (
                          <div key={file.name || index} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Glasses ${index + 1}`}
                              className="w-full h-24 object-cover rounded border-2 border-gray-700"
                            />

                            {/* First indicator */}
                            {index === 0 && (
                              <div className="absolute top-0 left-0 bg-green-600 text-white text-sm font-bold px-3 py-1 rounded-br shadow-lg">
                                ⭐ FIRST
                              </div>
                            )}

                            {/* Delete button */}
                            <button
                              onClick={() => removeFile('glasses', index)}
                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md transition-opacity"
                              title="Remove"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>

                            {/* Up arrow - not for first item */}
                            {index > 0 && (
                              <button
                                onClick={() => moveGlasses(index, 'up')}
                                className="absolute bottom-1 left-1 bg-blue-600 hover:bg-blue-700 text-white rounded p-1 shadow-md transition-opacity"
                                title="Move up"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                            )}

                            {/* Down arrow - not for last item */}
                            {index < deduplicateGlasses(glassesFiles).length - 1 && (
                              <button
                                onClick={() => moveGlasses(index, 'down')}
                                className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 text-white rounded p-1 shadow-md transition-opacity"
                                title="Move down"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={isUploading || subjectFiles.length === 0 || (!currentProject && glassesFiles.length === 0)}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isUploading || subjectFiles.length === 0 || (!currentProject && glassesFiles.length === 0)
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {isUploading ? 'Uploading...' : 'Start Try-On Processing'}
              </button>

              {isUploading && (
                <div className="mt-2">
                  <div className="bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 text-center">Uploading files...</p>
                </div>
              )}
            </div>

            {/* Current Job Status */}
            {currentJob && (
              <div className="bg-card rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium mb-4">Current Job Status</h3>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      currentJob.status === 'completed' ? 'bg-green-900 text-green-300' :
                      currentJob.status === 'processing' ? 'bg-blue-900 text-blue-300' :
                      currentJob.status === 'failed' ? 'bg-red-900 text-red-300' :
                      'bg-yellow-900 text-yellow-300'
                    }`}>
                      {currentJob.status.toUpperCase()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Job #{currentJob.id.slice(-8)}
                    </span>
                  </div>

                  {/* Overall Progress */}
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground">
                      {Math.round(currentJob.tasks.reduce((acc, task) => acc + task.progress, 0) / currentJob.tasks.length)}% Complete
                    </span>
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-full transition-all duration-500 ease-out ${
                          currentJob.status === 'completed' ? 'bg-green-500' :
                          currentJob.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                          currentJob.status === 'failed' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`}
                        style={{
                          width: `${currentJob.tasks.reduce((acc, task) => acc + task.progress, 0) / currentJob.tasks.length}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {currentJob.tasks.map((task, index) => (
                    <div key={task.id} className={`p-4 rounded-lg transition-all cursor-pointer ${
                      task.status === 'completed' ? 'bg-green-900/30 border-2 border-green-600 hover:bg-green-900/50' :
                      task.status === 'running' ? 'bg-muted' :
                      task.status === 'failed' ? 'bg-red-900/30 border-2 border-red-600' :
                      'bg-muted'
                    }`}
                    onClick={() => {
                      if (task.status === 'completed') {
                        setSelectedTask(task);
                      }
                    }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${
                          task.status === 'completed' ? 'text-green-300' : ''
                        }`}>
                          {task.status === 'completed' ? '✅ Photo Ready!' : `Photo ${index + 1}`}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full transition-all ${
                          task.status === 'completed' ? 'bg-green-600 text-white hover:bg-green-700 animate-pulse' :
                          task.status === 'running' ? 'bg-blue-600 text-white' :
                          task.status === 'failed' ? 'bg-red-600 text-white' :
                          'bg-gray-600 text-white'
                        }`}
                        >
                          {task.status === 'running' ? `${task.progress}%` :
                           task.status === 'completed' ? '👁️ VIEW RESULT' :
                           task.status === 'failed' ? 'Failed ✗' :
                           task.status === 'verifying' ? 'Verifying...' :
                           task.status}
                        </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ease-out ${
                              task.status === 'completed' ? 'bg-green-500' :
                              task.status === 'running' ? 'bg-blue-500 animate-pulse' :
                              task.status === 'failed' ? 'bg-red-500' :
                              task.status === 'verifying' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}
                            style={{
                              width: task.status === 'completed' ? '100%' :
                                     task.status === 'running' ? `${task.progress}%` :
                                     task.status === 'failed' ? '100%' :
                                     task.status === 'verifying' ? '75%' :
                                     '0%'
                            }}
                          />
                        </div>

                        {/* Status text with description */}
                        <div className="mt-2 text-xs">
                          {task.status === 'queued' && <span className="text-muted-foreground">Waiting to start processing...</span>}
                          {task.status === 'running' && <span className="text-blue-300">AI is generating your try-on photo... (${task.progress}%)</span>}
                          {task.status === 'verifying' && <span className="text-yellow-300">Running quality checks and final verification...</span>}
                          {task.status === 'completed' && (
                            <div className="space-y-1">
                              <span className="text-green-300 font-medium">🎉 SUCCESS! Click anywhere on this card to view your result below</span>
                              <div className="flex justify-center animate-bounce">
                                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                              </div>
                            </div>
                          )}
                          {task.status === 'failed' && <span className="text-red-300">Processing failed. Please try again.</span>}
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results Section */}
            <div id="results-section">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold">🖼️ Results</h2>
                {selectedTask ? (
                  <span className="text-sm text-green-400 bg-green-900/30 px-3 py-1 rounded-full">
                    Viewing: {selectedTask.id.slice(0, 8)}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Click on completed tasks above to view results
                  </span>
                )}
              </div>
              {selectedTask && selectedTask.result ? (
                <div className="bg-card rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-medium mb-4">Result Viewer</h3>

                  {/* Before/After Toggle */}
                  <div className="flex items-center justify-center space-x-4 mb-6">
                    <button
                      onClick={() => setShowBefore(!showBefore)}
                      className="flex items-center space-x-2 px-4 py-2 bg-muted rounded-lg hover:bg-accent transition-colors"
                    >
                      <span>{showBefore ? 'Before' : 'After'}</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </button>
                  </div>

                  {/* Image Display */}
                  <div className="relative bg-muted rounded-lg overflow-hidden mb-6">
                    <img
                      src={showBefore ? selectedTask.subjectFile.url : selectedTask.result.imageUrl}
                      alt={showBefore ? 'Original photo' : 'Photo with glasses'}
                      className="w-full h-auto max-h-96 object-contain"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-50 text-white text-sm rounded">
                      {showBefore ? 'Original' : 'With Glasses'}
                    </div>
                  </div>

                  {/* Download and Edit Options */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => downloadFile(showBefore ? selectedTask.subjectFile.url : selectedTask.result.imageUrl, `tryon_${showBefore ? 'original' : 'result'}_${selectedTask.id}.jpg`)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Save {showBefore ? 'Original' : 'Result'}</span>
                    </button>
                    <button
                      onClick={() => {
                        downloadFile(selectedTask.subjectFile.url, `tryon_original_${selectedTask.id}.jpg`);
                        setTimeout(() => {
                          downloadFile(selectedTask.result.imageUrl, `tryon_result_${selectedTask.id}.jpg`);
                        }, 500);
                      }}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Save Both</span>
                    </button>
                    <button
                      onClick={() => saveResultToProject(selectedTask)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      <span>Save to Project</span>
                    </button>
                    <button
                      onClick={() => openEditRequestModal(selectedTask)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Request Edit</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-lg shadow-sm border p-8 text-center">
                  <p className="text-muted-foreground">No result selected. Complete a job and click "View" on a completed task.</p>
                </div>
              )}
            </div>
          </div>

          {/* Gemini Transparency Panel - 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Gemini AI Transparency</h3>
                <button
                  onClick={generateKickassPrompt}
                  className="text-xs px-2 py-1 bg-muted rounded hover:bg-accent transition-colors"
                >
                  Refresh
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">See the AI prompt and conversation</p>

              {/* Prompt Display */}
              {showPrompt && (
                <div className="mb-6">
                  <h4 className="font-medium text-sm mb-2">Current Prompt</h4>
                  <div className="bg-muted rounded-lg p-3 max-h-48 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">{currentPrompt}</pre>
                  </div>

                  {/* Images Being Sent to Gemini */}
                  {selectedTask && (
                    <div className="mt-4">
                      <h4 className="font-medium text-sm mb-2">Images Being Sent to Gemini</h4>

                      {/* Subject Photo */}
                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1">Subject Photo:</p>
                        <div className="relative bg-background rounded border overflow-hidden">
                          <img
                            src={selectedTask.subjectFile.url}
                            alt="Subject photo"
                            className="w-full h-24 object-cover"
                          />
                          <div className="absolute top-1 left-1 px-1 py-0.5 bg-black bg-opacity-50 text-white text-xs rounded">
                            Subject
                          </div>
                        </div>
                      </div>

                      {/* Glasses Photos */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Reference Glasses ({deduplicateGlasses(selectedTask.glassesFiles).length}):</p>
                        <div className="grid grid-cols-2 gap-1">
                          {deduplicateGlasses(selectedTask.glassesFiles).slice(0, 4).map((glasses, index) => (
                            <div key={glasses.url || glasses.name || index} className="relative bg-background rounded border overflow-hidden">
                              <img
                                src={(() => {
                                  if (glasses.url) return glasses.url;
                                  if (glasses instanceof File) return URL.createObjectURL(glasses);
                                  if (typeof glasses === 'string') return glasses;
                                  return '';
                                })()}
                                alt={`Glasses ${index + 1}`}
                                className="w-full h-16 object-cover"
                              />
                              <div className="absolute top-0 left-0 px-1 py-0.5 bg-black bg-opacity-50 text-white text-xs rounded-br">
                                G{index + 1}
                              </div>
                            </div>
                          ))}
                          {deduplicateGlasses(selectedTask.glassesFiles).length > 4 && (
                            <div className="flex items-center justify-center h-16 bg-muted text-xs text-muted-foreground rounded border">
                              +{deduplicateGlasses(selectedTask.glassesFiles).length - 4} more
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Gemini Chat */}
              <div>
                <h4 className="font-medium text-sm mb-3">Gemini Conversation</h4>
                <div className="h-64 overflow-y-auto p-3 bg-muted rounded-lg mb-3">
                  {geminiMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm">
                      <p>No conversation yet.</p>
                      <p className="text-xs mt-1">Start processing to see Gemini's response.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {geminiMessages.map((message) => (
                        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs px-3 py-2 rounded-lg text-xs ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background text-foreground border'
                          }`}>
                            <p className="whitespace-pre-wrap">{message.content}</p>

                            {/* Show result image if available */}
                            {message.imageUrl && (
                              <div className="mt-2">
                                <img
                                  src={message.imageUrl}
                                  alt="Generated result"
                                  className="w-full rounded cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => {
                                    // Download the image when clicked
                                    const link = document.createElement('a');
                                    link.href = message.imageUrl;
                                    link.download = `tryon_result_${message.id}.jpg`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  }}
                                />
                                <p className="text-xs opacity-70 mt-1 text-center">Click to download</p>
                              </div>
                            )}

                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Indicator */}
                {currentJob && currentJob.status === 'processing' && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <div className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full"></div>
                    <span>Gemini is processing...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-950 border border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-300 mb-2">Privacy Notice</h3>
              <p className="text-sm text-blue-400">
                Your photos are processed securely and automatically deleted after 14 days.
                We do not use your images for AI training.
              </p>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Your Glasses Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-card rounded-lg shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow"
                   onClick={() => {
                     setCurrentProject(project);
                     loadProjectSubjectPhotos(project.id);
                     setSelectedSubjectPhoto(null);
                   }}>
                <h3 className="text-lg font-medium mb-2">{project.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {project.glassesFiles.length} glasses photos
                </p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {deduplicateGlasses(project.glassesFiles).slice(0, 9).map((file, index) => (
                    <div key={file.url || file.name || index} className="relative group">
                      <img
                        src={(() => {
                          if (file.url) return file.url;
                          if (file instanceof File) return URL.createObjectURL(file);
                          if (typeof file === 'string') return file;
                          return '';
                        })()}
                        alt={`Glasses ${index + 1}`}
                        className="w-full h-12 object-cover rounded border border-gray-700"
                      />

                      {/* First indicator */}
                      {index === 0 && (
                        <div className="absolute bottom-0 left-0 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded-tr font-bold">
                          ⭐ FIRST
                        </div>
                      )}

                      {/* Download button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = (() => {
                            if (file.url) return file.url;
                            if (file instanceof File) return URL.createObjectURL(file);
                            if (typeof file === 'string') return file;
                            return '';
                          })();
                          downloadFile(url, `${project.name}_glasses_${index + 1}.jpg`);
                        }}
                        className="absolute top-1 right-1 bg-gray-600 hover:bg-gray-700 text-white rounded-full p-1 shadow-md"
                        title="Save glasses photo"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProjectGlasses(project.id, index, file.name);
                        }}
                        className="absolute top-1 left-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-md"
                        title="Delete glasses photo"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      {/* Up arrow - not for first item */}
                      {index > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveProjectGlasses(project.id, index, 'up');
                          }}
                          className="absolute bottom-1 left-1 bg-blue-600 hover:bg-blue-700 text-white rounded p-1 shadow-md"
                          title="Move up"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                      )}

                      {/* Down arrow - not for last item */}
                      {index < Math.min(9, deduplicateGlasses(project.glassesFiles).length) - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveProjectGlasses(project.id, index, 'down');
                          }}
                          className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-700 text-white rounded p-1 shadow-md"
                          title="Move down"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {project.glassesFiles.length > 9 && (
                    <div className="w-full h-12 bg-muted rounded flex items-center justify-center text-sm border border-gray-700">
                      +{project.glassesFiles.length - 9}
                    </div>
                  )}
                </div>

                {/* Sizing Info */}
                {project.sizingInfo && (
                  <div className="mt-3 p-3 bg-blue-950 border border-blue-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-blue-300">
                        {project.sizingInfo.exact ? `${project.sizingInfo.exact.model} (${project.sizingInfo.exact.frame})` : 'Size Chart'}
                      </span>
                      <a
                        href={project.sizingInfo.sizeChartUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        View Full Chart →
                      </a>
                    </div>
                    {project.sizingInfo.exact ? (
                      <div className="text-xs text-blue-300 space-y-1 mb-2 pb-2 border-b border-blue-800">
                        <div className="font-semibold text-blue-200">Exact Measurements:</div>
                        <div>Lens: {project.sizingInfo.exact.lensWidth} × {project.sizingInfo.exact.lensHeight}</div>
                        <div>Bridge: {project.sizingInfo.exact.bridge} | Temple: {project.sizingInfo.exact.temple}</div>
                        <div>Frame Width: {project.sizingInfo.exact.frameWidth}</div>
                      </div>
                    ) : null}
                    <div className="text-xs text-blue-400 space-y-1">
                      <div className="text-blue-300 text-[10px] uppercase tracking-wide mb-1">General Size Ranges:</div>
                      <div>Small: {project.sizingInfo.sizes.small.lensWidth} | {project.sizingInfo.sizes.small.bridge} | {project.sizingInfo.sizes.small.temple}</div>
                      <div>Medium: {project.sizingInfo.sizes.medium.lensWidth} | {project.sizingInfo.sizes.medium.bridge} | {project.sizingInfo.sizes.medium.temple}</div>
                      <div>Large: {project.sizingInfo.sizes.large.lensWidth} | {project.sizingInfo.sizes.large.bridge} | {project.sizingInfo.sizes.large.temple}</div>
                    </div>
                  </div>
                )}

                {/* Results Section - Collapsible */}
                <div className="mt-4">
                  <div
                    className="flex items-center justify-between p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => toggleProjectResults(project.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <svg
                        className={`w-4 h-4 text-green-600 transition-transform duration-200 ${expandedProjectResults.has(project.id) ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <h4 className="text-sm font-medium text-green-600">Try-On Results</h4>
                    </div>
                    {getProjectResults(project.id).length > 0 && (
                      <span className="text-xs text-muted-foreground bg-green-900 text-green-300 px-2 py-1 rounded">
                        {getProjectResults(project.id).length} completed
                      </span>
                    )}
                  </div>

                  {expandedProjectResults.has(project.id) && (
                    <div className="mt-2">
                      {getProjectResults(project.id).length > 0 ? (
                        <div className="grid grid-cols-2 gap-1">
                          {getProjectResults(project.id).map((result, index) => (
                            <div key={result.taskId} className="relative group">
                              <div className="relative cursor-pointer"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     openLightbox(
                                       result.result?.imageUrl || result.imageUrl,
                                       getProjectResults(project.id),
                                       index
                                     );
                                   }}>
                                <img
                                  src={result.result?.imageUrl || result.imageUrl}
                                  alt={`Result ${index + 1}`}
                                  className="w-full h-32 object-cover rounded hover:opacity-90 transition-opacity"
                                />
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-xs truncate">
                                  {new Date(result.completedAt).toLocaleDateString()}
                                </p>
                              </div>

                              {/* View button (eye icon) */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  viewTaskResult(result);
                                }}
                                className="absolute top-1 right-1 bg-green-600 hover:bg-green-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                title="View result"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>

                              {/* Edit button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(result);
                                }}
                                className="absolute top-1 left-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                title="Edit & re-run"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>

                              {/* Request Edit button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditRequestModal(result);
                                }}
                                className="absolute top-1 right-1 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                title="Request Edit"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </button>

                              {/* Delete button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteProjectResult(project.id, result.taskId);
                                }}
                                className="absolute bottom-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                title="Delete result"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ))}
                          {getProjectResults(project.id).length > 6 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedProjectResults(prev => new Set([...prev, project.id]));
                              }}
                              className="w-full h-12 bg-muted hover:bg-accent rounded flex items-center justify-center text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                              +{getProjectResults(project.id).length - 6} more
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-16 bg-muted rounded flex items-center justify-center text-sm text-muted-foreground">
                          No try-on results yet. Create jobs using this project!
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentProject(project);
                      loadProjectSubjectPhotos(project.id);
                      setSelectedSubjectPhoto(null);
                    }}
                    className="flex items-center space-x-1 px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors text-sm"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Use Project</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      project.glassesFiles.forEach((file, index) => {
                        setTimeout(() => {
                          downloadFile(file.url, `${project.name}_glasses_${index + 1}.jpg`);
                        }, index * 200);
                      });
                    }}
                    className="flex items-center space-x-1 px-3 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 transition-colors text-sm"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Save All</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProject(project.id, project.name);
                    }}
                    className="flex items-center space-x-1 px-3 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors text-sm"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}

            {projects.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No projects yet. Create your first project!</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Project Creation Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Create New Project</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g., Summer Collection 2024"
                  className="w-full px-3 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sizing Chart URL (Optional)</label>
                <input
                  type="url"
                  value={newProjectSizingUrl}
                  onChange={(e) => setNewProjectSizingUrl(e.target.value)}
                  placeholder="https://brand.com/pages/size-chart"
                  className="w-full px-3 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Link to brand's official sizing chart for automatic sizing extraction
                </p>
              </div>

              {/* Manual Measurements - Collapsible */}
              <details className="text-sm">
                <summary className="cursor-pointer text-sm font-medium mb-2 text-blue-400 hover:text-blue-300">
                  ➕ Or Enter Exact Measurements Manually
                </summary>
                <div className="mt-3 space-y-3 p-3 bg-muted/50 rounded-lg border border-gray-700">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Model Name</label>
                      <input
                        type="text"
                        value={newProjectModel}
                        onChange={(e) => setNewProjectModel(e.target.value)}
                        placeholder="e.g., Popp Daylight"
                        className="w-full px-2 py-1.5 bg-muted rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Frame Size</label>
                      <input
                        type="text"
                        value={newProjectFrame}
                        onChange={(e) => setNewProjectFrame(e.target.value)}
                        placeholder="e.g., 51-16-145"
                        className="w-full px-2 py-1.5 bg-muted rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Lens Width</label>
                      <input
                        type="text"
                        value={newProjectLensWidth}
                        onChange={(e) => setNewProjectLensWidth(e.target.value)}
                        placeholder="51mm"
                        className="w-full px-2 py-1.5 bg-muted rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Lens Height</label>
                      <input
                        type="text"
                        value={newProjectLensHeight}
                        onChange={(e) => setNewProjectLensHeight(e.target.value)}
                        placeholder="36mm"
                        className="w-full px-2 py-1.5 bg-muted rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Bridge</label>
                      <input
                        type="text"
                        value={newProjectBridge}
                        onChange={(e) => setNewProjectBridge(e.target.value)}
                        placeholder="16mm"
                        className="w-full px-2 py-1.5 bg-muted rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Temple</label>
                      <input
                        type="text"
                        value={newProjectTemple}
                        onChange={(e) => setNewProjectTemple(e.target.value)}
                        placeholder="145mm"
                        className="w-full px-2 py-1.5 bg-muted rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Total Frame Width</label>
                      <input
                        type="text"
                        value={newProjectFrameWidth}
                        onChange={(e) => setNewProjectFrameWidth(e.target.value)}
                        placeholder="118mm"
                        className="w-full px-2 py-1.5 bg-muted rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </details>

              <div>
                <label className="block text-sm font-medium mb-2">Glasses Photos</label>
                <div
                  {...getGlassesRootProps()}
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50"
                >
                  <input {...getGlassesInputProps()} />
                  <p className="text-muted-foreground">Drop glasses photos here or click to select</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 25MB</p>
                </div>

                {glassesFiles.length > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {glassesFiles.length} photos selected
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowProjectModal(false)}
                className="px-4 py-2 bg-muted rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={!newProjectName.trim() || glassesFiles.length === 0}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  !newProjectName.trim() || glassesFiles.length === 0
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                Save Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit & Re-run Modal */}
      {showEditModal && editingResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Edit & Re-run Result</h3>

            {/* Original result preview */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Original Result:</p>
              <img
                src={editingResult.imageUrl}
                alt="Original result"
                className="w-full h-32 object-cover rounded border border-gray-700"
              />
            </div>

            {/* Subject file re-upload warning - only show if not permanent */}
            {!editingResult.subjectFile?.permanent && (
              <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                <p className="text-sm text-yellow-200 mb-2">
                  ⚠️ Original subject file may not be available
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  If the re-run fails, please re-upload your subject photo below:
                </p>
                <label className="block w-full">
                  <div className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors">
                    <div className="text-center">
                      <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="mt-2 text-sm text-gray-300">
                      {editSubjectFile ? editSubjectFile.name : 'Click to upload subject photo (optional)'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setEditSubjectFile(file);
                      }
                    }}
                  />
                </div>
              </label>
            </div>
            )}

            {/* Parameter adjustments */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Adjust Parameters:</h4>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Guidance: {editGuidance.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={editGuidance}
                  onChange={(e) => setEditGuidance(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Higher = more faithful to glasses, Lower = more creative
                </p>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Reference Strength: {editRefStrength.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={editRefStrength}
                  onChange={(e) => setEditRefStrength(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How strongly to match the glasses reference image
                </p>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Lighting Weight: {editLightingWeight.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={editLightingWeight}
                  onChange={(e) => setEditLightingWeight(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Reflection Weight: {editReflectionWeight.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={editReflectionWeight}
                  onChange={(e) => setEditReflectionWeight(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Color Match Weight: {editColorMatchWeight.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={editColorMatchWeight}
                  onChange={(e) => setEditColorMatchWeight(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingResult(null);
                  setEditSubjectFile(null);
                }}
                className="px-4 py-2 bg-muted rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRerun}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Re-run with New Parameters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Request Modal */}
      {showEditRequestModal && requestingEditFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Request Edit</h3>

            {/* Result preview */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Current Result:</p>
              <img
                src={requestingEditFor.result?.imageUrl || requestingEditFor.imageUrl}
                alt="Current result"
                className="w-full h-32 object-cover rounded border border-gray-700"
              />
            </div>

            {/* Project Subject Photos Selection */}
            {projectSubjectPhotos.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Select a subject photo from this project:
                </p>
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {projectSubjectPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedSubjectPhoto(photo)}
                      className={`relative cursor-pointer rounded border-2 transition-all ${
                        selectedSubjectPhoto?.id === photo.id
                          ? 'border-blue-500 ring-2 ring-blue-500/50'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt={photo.name}
                        className="w-full h-16 object-cover rounded"
                      />
                      {selectedSubjectPhoto?.id === photo.id && (
                        <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subject file re-upload warning - only show if not permanent and no project photos selected */}
            {!requestingEditFor.subjectFile?.permanent && (
              <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg">
                <p className="text-sm text-yellow-200 mb-2">
                  ⚠️ Original subject file may not be available
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  If the edit fails, please re-upload your subject photo below:
                </p>
                <label className="block w-full">
                  <div className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 transition-colors">
                    <div className="text-center">
                      <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="mt-2 text-sm text-gray-300">
                        {editSubjectFile ? editSubjectFile.name : 'Click to upload subject photo (optional)'}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEditSubjectFile(file);
                        }
                      }}
                    />
                  </div>
                </label>
              </div>
            )}

            {/* Edit request text area */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Describe the changes you want:
              </label>
              <textarea
                value={editRequestText}
                onChange={(e) => setEditRequestText(e.target.value)}
                placeholder="e.g., Make the glasses slightly smaller, adjust the angle, darken the lenses..."
                className="w-full px-3 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Be specific about what to change - glasses size, position, angle, lens color, etc.
              </p>
            </div>

            {/* Example requests */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">Example requests:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Make glasses smaller',
                  'Move glasses up slightly',
                  'Darken the lenses',
                  'Adjust the angle',
                  'More transparent lenses'
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => setEditRequestText(editRequestText + (editRequestText ? ' ' : '') + example)}
                    className="px-2 py-1 bg-muted hover:bg-accent text-xs rounded transition-colors"
                  >
                    + {example}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowEditRequestModal(false);
                  setEditRequestText('');
                  setRequestingEditFor(null);
                  setEditSubjectFile(null);
                  setSelectedSubjectPhoto(null);
                }}
                className="px-4 py-2 bg-muted rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitEditRequest}
                disabled={!editRequestText.trim()}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  !editRequestText.trim()
                    ? 'bg-purple-600/50 text-white/50 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for full-size image viewing with navigation */}
      {lightboxImage && lightboxResults.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-6xl max-h-full">
            {/* Previous button */}
            {lightboxResults.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevImage();
                }}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-12 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <img
              src={lightboxImage}
              alt={`Result ${lightboxIndex + 1} of ${lightboxResults.length}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Next button */}
            {lightboxResults.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextImage();
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-12 bg-black/40 hover:bg-black/60 text-white rounded-full p-3 transition-all"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Counter - consistent format with no spaces */}
            {lightboxResults.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-full text-sm font-medium">
                {lightboxIndex + 1}/{lightboxResults.length}
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}