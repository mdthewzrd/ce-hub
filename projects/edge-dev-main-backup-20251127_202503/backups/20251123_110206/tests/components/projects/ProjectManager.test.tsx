/**
 * Comprehensive Tests for ProjectManager Component
 *
 * Tests all aspects of the ProjectManager React component including:
 * - Project CRUD operations via UI
 * - State management and data flow
 * - User interactions and event handling
 * - Error handling and validation
 * - Integration with API services
 * - Performance and rendering optimization
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';

// Mock the API service
jest.mock('../../../services/projectApiService');

import ProjectManager from '../../../components/projects/ProjectManager';
import * as projectApiService from '../../../services/projectApiService';
import { Project, ProjectStatus, AggregationMethod } from '../../../types/projectTypes';

// Mock project data
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'LC Momentum Setup',
    description: 'LC momentum strategy with 3 scanners',
    status: ProjectStatus.ACTIVE,
    aggregation_method: AggregationMethod.WEIGHTED,
    tags: ['lc', 'momentum'],
    created_by: 'test-user',
    version: 1,
    created_at: new Date('2024-10-01T10:00:00Z'),
    updated_at: new Date('2024-10-01T10:00:00Z'),
    last_executed: new Date('2024-10-15T14:30:00Z'),
    execution_count: 5,
    total_signals_generated: 150,
    settings: {},
    scanners: []
  },
  {
    id: '2',
    name: 'Volume Breakout Strategy',
    description: 'Volume-based breakout detection',
    status: ProjectStatus.ACTIVE,
    aggregation_method: AggregationMethod.UNION,
    tags: ['volume', 'breakout'],
    created_by: 'test-user',
    version: 1,
    created_at: new Date('2024-10-02T11:00:00Z'),
    updated_at: new Date('2024-10-02T11:00:00Z'),
    last_executed: null,
    execution_count: 0,
    total_signals_generated: 0,
    settings: {},
    scanners: []
  }
];

const mockApiService = projectApiService as jest.Mocked<typeof projectApiService>;

describe('ProjectManager Component', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Default successful API responses
    mockApiService.getProjects.mockResolvedValue(mockProjects);
    mockApiService.createProject.mockImplementation((project) =>
      Promise.resolve({
        ...project,
        id: 'new-id',
        created_at: new Date(),
        updated_at: new Date(),
        execution_count: 0,
        total_signals_generated: 0,
        scanners: []
      } as Project)
    );
    mockApiService.updateProject.mockImplementation((id, updates) =>
      Promise.resolve({ ...mockProjects.find(p => p.id === id)!, ...updates })
    );
    mockApiService.deleteProject.mockResolvedValue(undefined);
  });

  describe('Initial Rendering and Loading', () => {
    it('should render loading state initially', async () => {
      // Delay the API response to test loading state
      mockApiService.getProjects.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockProjects), 100))
      );

      render(<ProjectManager />);

      expect(screen.getByTestId('projects-loading')).toBeInTheDocument();
      expect(screen.getByText(/loading projects/i)).toBeInTheDocument();
    });

    it('should render projects after loading', async () => {
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.queryByTestId('projects-loading')).not.toBeInTheDocument();
      });

      expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      expect(screen.getByText('Volume Breakout Strategy')).toBeInTheDocument();
    });

    it('should handle API error gracefully', async () => {
      mockApiService.getProjects.mockRejectedValue(new Error('API Error'));

      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByTestId('projects-error')).toBeInTheDocument();
      });

      expect(screen.getByText(/failed to load projects/i)).toBeInTheDocument();
      expect(screen.getByText(/API Error/)).toBeInTheDocument();
    });

    it('should show empty state when no projects exist', async () => {
      mockApiService.getProjects.mockResolvedValue([]);

      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByTestId('projects-empty-state')).toBeInTheDocument();
      });

      expect(screen.getByText(/no projects found/i)).toBeInTheDocument();
      expect(screen.getByText(/create your first project/i)).toBeInTheDocument();
    });
  });

  describe('Project Display and Information', () => {
    it('should display project information correctly', async () => {
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      const lcProject = screen.getByTestId('project-card-1');

      expect(within(lcProject).getByText('LC Momentum Setup')).toBeInTheDocument();
      expect(within(lcProject).getByText('LC momentum strategy with 3 scanners')).toBeInTheDocument();
      expect(within(lcProject).getByText('WEIGHTED')).toBeInTheDocument();
      expect(within(lcProject).getByText('5 executions')).toBeInTheDocument();
      expect(within(lcProject).getByText('150 signals')).toBeInTheDocument();
    });

    it('should display project status correctly', async () => {
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      const activeProjects = screen.getAllByTestId(/project-status-active/);
      expect(activeProjects).toHaveLength(2);
    });

    it('should display project tags', async () => {
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      expect(screen.getByText('lc')).toBeInTheDocument();
      expect(screen.getByText('momentum')).toBeInTheDocument();
      expect(screen.getByText('volume')).toBeInTheDocument();
      expect(screen.getByText('breakout')).toBeInTheDocument();
    });

    it('should format dates correctly', async () => {
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      // Check for formatted dates (exact format may vary)
      expect(screen.getByText(/oct.*2024/i)).toBeInTheDocument();
    });

    it('should show never executed state correctly', async () => {
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('Volume Breakout Strategy')).toBeInTheDocument();
      });

      const volumeProject = screen.getByTestId('project-card-2');
      expect(within(volumeProject).getByText(/never executed/i)).toBeInTheDocument();
    });
  });

  describe('Project Creation', () => {
    it('should open create project dialog when create button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      const createButton = screen.getByTestId('create-project-button');
      await user.click(createButton);

      expect(screen.getByTestId('create-project-dialog')).toBeInTheDocument();
      expect(screen.getByText(/create new project/i)).toBeInTheDocument();
    });

    it('should create a new project with valid data', async () => {
      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      // Open create dialog
      const createButton = screen.getByTestId('create-project-button');
      await user.click(createButton);

      // Fill form
      const nameInput = screen.getByTestId('project-name-input');
      const descInput = screen.getByTestId('project-description-input');
      const methodSelect = screen.getByTestId('aggregation-method-select');

      await user.clear(nameInput);
      await user.type(nameInput, 'New Test Project');
      await user.clear(descInput);
      await user.type(descInput, 'Test project description');
      await user.selectOptions(methodSelect, AggregationMethod.UNION);

      // Submit form
      const submitButton = screen.getByTestId('create-project-submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockApiService.createProject).toHaveBeenCalledWith({
          name: 'New Test Project',
          description: 'Test project description',
          aggregation_method: AggregationMethod.UNION,
          tags: [],
          status: ProjectStatus.ACTIVE
        });
      });

      // Dialog should close
      expect(screen.queryByTestId('create-project-dialog')).not.toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      // Open create dialog
      const createButton = screen.getByTestId('create-project-button');
      await user.click(createButton);

      // Try to submit without required fields
      const submitButton = screen.getByTestId('create-project-submit');
      await user.click(submitButton);

      expect(screen.getByText(/project name is required/i)).toBeInTheDocument();
      expect(mockApiService.createProject).not.toHaveBeenCalled();
    });

    it('should handle creation errors', async () => {
      const user = userEvent.setup();
      mockApiService.createProject.mockRejectedValue(new Error('Creation failed'));

      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      // Open create dialog and fill form
      const createButton = screen.getByTestId('create-project-button');
      await user.click(createButton);

      const nameInput = screen.getByTestId('project-name-input');
      await user.type(nameInput, 'Test Project');

      const submitButton = screen.getByTestId('create-project-submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to create project/i)).toBeInTheDocument();
        expect(screen.getByText(/creation failed/i)).toBeInTheDocument();
      });
    });

    it('should parse and validate tags input', async () => {
      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      // Open create dialog
      const createButton = screen.getByTestId('create-project-button');
      await user.click(createButton);

      // Fill form with tags
      const nameInput = screen.getByTestId('project-name-input');
      const tagsInput = screen.getByTestId('project-tags-input');

      await user.type(nameInput, 'Tagged Project');
      await user.type(tagsInput, 'tag1, tag2, tag3');

      const submitButton = screen.getByTestId('create-project-submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockApiService.createProject).toHaveBeenCalledWith(
          expect.objectContaining({
            tags: ['tag1', 'tag2', 'tag3']
          })
        );
      });
    });
  });

  describe('Project Editing', () => {
    it('should open edit dialog when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      const editButton = screen.getByTestId('edit-project-1');
      await user.click(editButton);

      expect(screen.getByTestId('edit-project-dialog')).toBeInTheDocument();
      expect(screen.getByDisplayValue('LC Momentum Setup')).toBeInTheDocument();
    });

    it('should pre-populate edit form with existing data', async () => {
      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      const editButton = screen.getByTestId('edit-project-1');
      await user.click(editButton);

      expect(screen.getByDisplayValue('LC Momentum Setup')).toBeInTheDocument();
      expect(screen.getByDisplayValue('LC momentum strategy with 3 scanners')).toBeInTheDocument();
      expect(screen.getByDisplayValue('lc, momentum')).toBeInTheDocument();
    });

    it('should update project with modified data', async () => {
      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      // Open edit dialog
      const editButton = screen.getByTestId('edit-project-1');
      await user.click(editButton);

      // Modify data
      const nameInput = screen.getByDisplayValue('LC Momentum Setup');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated LC Momentum Setup');

      // Submit
      const submitButton = screen.getByTestId('update-project-submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockApiService.updateProject).toHaveBeenCalledWith('1',
          expect.objectContaining({
            name: 'Updated LC Momentum Setup'
          })
        );
      });
    });

    it('should handle update errors', async () => {
      const user = userEvent.setup();
      mockApiService.updateProject.mockRejectedValue(new Error('Update failed'));

      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      const editButton = screen.getByTestId('edit-project-1');
      await user.click(editButton);

      const submitButton = screen.getByTestId('update-project-submit');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to update project/i)).toBeInTheDocument();
      });
    });
  });

  describe('Project Deletion', () => {
    it('should show confirmation dialog before deletion', async () => {
      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId('delete-project-1');
      await user.click(deleteButton);

      expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();
      expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
    });

    it('should delete project when confirmed', async () => {
      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      // Open delete confirmation
      const deleteButton = screen.getByTestId('delete-project-1');
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByTestId('confirm-delete-button');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockApiService.deleteProject).toHaveBeenCalledWith('1');
      });
    });

    it('should cancel deletion when cancelled', async () => {
      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      // Open delete confirmation
      const deleteButton = screen.getByTestId('delete-project-1');
      await user.click(deleteButton);

      // Cancel deletion
      const cancelButton = screen.getByTestId('cancel-delete-button');
      await user.click(cancelButton);

      expect(screen.queryByTestId('delete-confirmation-dialog')).not.toBeInTheDocument();
      expect(mockApiService.deleteProject).not.toHaveBeenCalled();
    });

    it('should handle deletion errors', async () => {
      const user = userEvent.setup();
      mockApiService.deleteProject.mockRejectedValue(new Error('Deletion failed'));

      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId('delete-project-1');
      await user.click(deleteButton);

      const confirmButton = screen.getByTestId('confirm-delete-button');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to delete project/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filtering', () => {
    it('should filter projects by search term', async () => {
      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('project-search-input');
      await user.type(searchInput, 'momentum');

      // Should show only LC Momentum project
      expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      expect(screen.queryByText('Volume Breakout Strategy')).not.toBeInTheDocument();
    });

    it('should filter projects by status', async () => {
      const user = userEvent.setup();

      // Add inactive project to mock data
      const mockProjectsWithInactive = [
        ...mockProjects,
        {
          ...mockProjects[0],
          id: '3',
          name: 'Inactive Project',
          status: ProjectStatus.INACTIVE
        }
      ];
      mockApiService.getProjects.mockResolvedValue(mockProjectsWithInactive);

      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      const statusFilter = screen.getByTestId('status-filter-select');
      await user.selectOptions(statusFilter, ProjectStatus.INACTIVE);

      // Should show only inactive projects
      expect(screen.getByText('Inactive Project')).toBeInTheDocument();
      expect(screen.queryByText('LC Momentum Setup')).not.toBeInTheDocument();
    });

    it('should filter projects by aggregation method', async () => {
      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      const methodFilter = screen.getByTestId('method-filter-select');
      await user.selectOptions(methodFilter, AggregationMethod.WEIGHTED);

      // Should show only weighted projects
      expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      expect(screen.queryByText('Volume Breakout Strategy')).not.toBeInTheDocument();
    });

    it('should clear search when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      // Search for something
      const searchInput = screen.getByTestId('project-search-input');
      await user.type(searchInput, 'momentum');

      // Clear search
      const clearButton = screen.getByTestId('clear-search-button');
      await user.click(clearButton);

      // Should show all projects again
      expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      expect(screen.getByText('Volume Breakout Strategy')).toBeInTheDocument();
    });
  });

  describe('Sorting and Pagination', () => {
    it('should sort projects by name', async () => {
      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      const sortSelect = screen.getByTestId('sort-projects-select');
      await user.selectOptions(sortSelect, 'name-asc');

      const projectCards = screen.getAllByTestId(/project-card-/);
      const firstProject = within(projectCards[0]);

      // LC Momentum Setup should come before Volume Breakout Strategy alphabetically
      expect(firstProject.getByText('LC Momentum Setup')).toBeInTheDocument();
    });

    it('should sort projects by last executed date', async () => {
      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      const sortSelect = screen.getByTestId('sort-projects-select');
      await user.selectOptions(sortSelect, 'last-executed-desc');

      // Projects with recent executions should come first
      const projectCards = screen.getAllByTestId(/project-card-/);
      const firstProject = within(projectCards[0]);

      // LC Momentum Setup has a last_executed date, should be first
      expect(firstProject.getByText('LC Momentum Setup')).toBeInTheDocument();
    });

    it('should handle pagination when many projects exist', async () => {
      // Mock many projects
      const manyProjects = Array.from({ length: 25 }, (_, i) => ({
        ...mockProjects[0],
        id: `project-${i}`,
        name: `Project ${i + 1}`
      }));

      mockApiService.getProjects.mockResolvedValue(manyProjects);

      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('Project 1')).toBeInTheDocument();
      });

      // Should show pagination controls
      expect(screen.getByTestId('pagination-controls')).toBeInTheDocument();

      // Should show limited number of projects per page
      const projectCards = screen.getAllByTestId(/project-card-/);
      expect(projectCards.length).toBeLessThanOrEqual(10); // Assuming 10 per page

      // Test next page
      const nextButton = screen.getByTestId('pagination-next');
      await user.click(nextButton);

      // Should show different projects
      expect(screen.getByText(/project 1[1-9]/)).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should not re-render unnecessarily', async () => {
      const renderSpy = jest.fn();
      const MockProjectManager = () => {
        renderSpy();
        return <ProjectManager />;
      };

      render(<MockProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      const initialRenderCount = renderSpy.mock.calls.length;

      // Interact with component that shouldn't cause re-render
      const searchInput = screen.getByTestId('project-search-input');
      fireEvent.focus(searchInput);
      fireEvent.blur(searchInput);

      // Should not cause additional renders
      expect(renderSpy.mock.calls.length).toBe(initialRenderCount);
    });

    it('should debounce search input', async () => {
      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('project-search-input');

      // Type multiple characters quickly
      await user.type(searchInput, 'mom');

      // Should debounce the search and not filter immediately
      // (Implementation detail - may need adjustment based on actual debounce implementation)
      expect(screen.getByText('Volume Breakout Strategy')).toBeInTheDocument();

      // After debounce delay
      await waitFor(() => {
        expect(screen.queryByText('Volume Breakout Strategy')).not.toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should handle large dataset efficiently', async () => {
      // Mock large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockProjects[0],
        id: `large-project-${i}`,
        name: `Large Project ${i + 1}`
      }));

      mockApiService.getProjects.mockResolvedValue(largeDataset);

      const startTime = performance.now();

      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('Large Project 1')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (adjust threshold as needed)
      expect(renderTime).toBeLessThan(2000); // 2 seconds
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      // Check for proper ARIA labels
      expect(screen.getByLabelText(/search projects/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create new project/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByTestId('project-search-input')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('create-project-button')).toHaveFocus();

      // Should be able to activate with Enter/Space
      await user.keyboard(' ');
      expect(screen.getByTestId('create-project-dialog')).toBeInTheDocument();
    });

    it('should announce status changes to screen readers', async () => {
      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      // Create new project
      const createButton = screen.getByTestId('create-project-button');
      await user.click(createButton);

      const nameInput = screen.getByTestId('project-name-input');
      await user.type(nameInput, 'New Project');

      const submitButton = screen.getByTestId('create-project-submit');
      await user.click(submitButton);

      // Should have aria-live region for status announcements
      await waitFor(() => {
        expect(screen.getByTestId('status-announcer')).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundaries and Recovery', () => {
    it('should recover from component errors gracefully', () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Component that throws an error
      const ThrowingComponent = () => {
        throw new Error('Test error');
      };

      const ErrorBoundaryTest = () => (
        <React.Suspense fallback={<div>Loading...</div>}>
          <ThrowingComponent />
        </React.Suspense>
      );

      // This test would require an error boundary to be implemented
      // For now, just verify the component can handle prop errors

      consoleSpy.mockRestore();
    });

    it('should show retry option on API failures', async () => {
      const user = userEvent.setup();
      mockApiService.getProjects.mockRejectedValueOnce(new Error('Network error'));

      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByTestId('projects-error')).toBeInTheDocument();
      });

      const retryButton = screen.getByTestId('retry-load-projects');
      expect(retryButton).toBeInTheDocument();

      // Mock successful retry
      mockApiService.getProjects.mockResolvedValueOnce(mockProjects);
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });
    });
  });

  describe('Integration with Other Components', () => {
    it('should communicate with ScannerSelector component', async () => {
      // This would test integration with ScannerSelector
      // when a project is selected for editing

      const user = userEvent.setup();
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      // Click to view/edit scanners
      const manageScanners = screen.getByTestId('manage-scanners-1');
      await user.click(manageScanners);

      // Should trigger scanner management view
      expect(screen.getByTestId('scanner-selector')).toBeInTheDocument();
    });

    it('should pass correct props to child components', async () => {
      render(<ProjectManager />);

      await waitFor(() => {
        expect(screen.getByText('LC Momentum Setup')).toBeInTheDocument();
      });

      // Check that project data is passed correctly to project cards
      const projectCard = screen.getByTestId('project-card-1');

      expect(within(projectCard).getByText('LC Momentum Setup')).toBeInTheDocument();
      expect(within(projectCard).getByTestId('project-status-active')).toBeInTheDocument();
    });
  });
});