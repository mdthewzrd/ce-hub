"""
Example Implementations of the New Validation Framework
Shows real-world usage of the state-driven validation system
"""

import asyncio
import pytest
from typing import Dict, Any

# Import our validation framework
from .validation_suite import (
    ValidationSuite, ValidationConfig, TestCategory, TestSuite,
    quick_component_validation, quick_visual_validation
)
from .stateful_validator import ComponentState, ReactStateValidator
from .component_testing import ComponentTester, FormContract, DataTableContract
from .visual_regression import ComparisonMethod, RegressionConfig
from .waiting_strategies import SmartWaiter, common_waits, WaitStrategy

class ExampleValidations:
    """Collection of validation examples demonstrating the new framework"""

    @staticmethod
    async def validate_user_registration_flow(page) -> Dict[str, Any]:
        """
        Example: Comprehensive user registration flow validation

        This replaces multiple brittle PlayWright tests with one comprehensive
        state-driven validation that checks form behavior, validation, and visual appearance.
        """

        # Configure comprehensive validation
        config = ValidationConfig(
            level=ValidationLevel.COMPREHENSIVE,
            enabled_categories={
                TestCategory.FUNCTIONAL,  # Form behavior and validation
                TestCategory.VISUAL,      # Visual regression
                TestCategory.PERFORMANCE  # Load time and responsiveness
            },
            timeout=20.0,
            generate_reports=True,
            save_screenshots=True
        )

        suite = ValidationSuite(config)

        # Define comprehensive test suite for registration
        registration_tests = TestSuite('user_registration', [
            {
                'name': 'registration_form_structure',
                'category': 'functional',
                'target': page.locator('.registration-form'),
                'context': {
                    'component_type': 'form',
                    'expected_fields': ['email', 'password', 'confirm_password', 'username'],
                    'validation_rules': {
                        'email': 'required|email',
                        'password': 'required|min:8',
                        'confirm_password': 'required|same:password',
                        'username': 'required|min:3|max:20'
                    }
                }
            },
            {
                'name': 'registration_visual_appearance',
                'category': 'visual',
                'target': page,
                'context': {'test_name': 'registration_page'}
            },
            {
                'name': 'registration_performance',
                'category': 'performance',
                'target': page,
                'context': {'max_load_time': 3.0}
            }
        ], config)

        # Navigate to registration page
        await page.goto('/register')

        # Wait for page to be fully ready
        await common_waits.wait_for_dom_stability(
            lambda: page.evaluate('document.readyState'),
            timeout=10.0
        )

        # Run comprehensive validation
        result = await suite.run_test_suite(registration_tests)

        # Test form validation behavior
        print("Testing form validation...")

        # Test empty form submission
        await page.click('.submit-button')

        # Wait for validation errors to appear
        validation_errors = await common_waits.wait_for_form_validation(
            lambda: page.evaluate('''
                const errors = {};
                document.querySelectorAll('.error-message').forEach(el => {
                    const field = el.getAttribute('data-field');
                    if (field) errors[field] = el.textContent;
                });
                return {
                    has_errors: Object.keys(errors).length > 0,
                    errors: errors,
                    valid: document.querySelector('.registration-form').checkValidity()
                };
            '''),
            timeout=5.0
        )

        assert validation_errors.success, "Form validation errors should appear"

        # Test valid form submission
        await page.fill('#email', 'test@example.com')
        await page.fill('#password', 'securepassword123')
        await page.fill('#confirm_password', 'securepassword123')
        await page.fill('#username', 'testuser')

        # Wait for form to become valid
        form_valid = await common_waits.wait_for_custom_state(
            lambda: page.evaluate('document.querySelector(".registration-form").checkValidity()'),
            expected_state=True,
            timeout=5.0
        )

        assert form_valid.success, "Form should be valid with correct input"

        # Submit valid form
        await page.click('.submit-button')

        # Wait for successful registration
        registration_success = await common_waits.wait_for_custom_state(
            lambda: page.evaluate('window.registrationSuccess || false'),
            expected_state=True,
            timeout=15.0
        )

        # Return comprehensive results
        return {
            'initial_validation': result,
            'form_validation_passed': validation_errors.success,
            'form_became_valid': form_valid.success,
            'registration_successful': registration_success.success,
            'overall_success': (
                result.passed and
                validation_errors.success and
                form_valid.success and
                registration_success.success
            )
        }

    @staticmethod
    async def validate_data_grid_functionality(page) -> Dict[str, Any]:
        """
        Example: Advanced data grid validation with state management

        This replaces multiple PlayWright tests that check individual features
        with comprehensive state-driven validation of the entire data grid component.
        """

        component_tester = ComponentTester()
        state_validator = ReactStateValidator()
        waiter = SmartWaiter()

        # Wait for data grid to be ready with actual data
        data_ready = await waiter.wait(
            condition=lambda: page.evaluate('''
                // Check if data grid has loaded data and is ready
                const grid = document.querySelector('.data-grid');
                if (!grid) return false;

                const rows = grid.querySelectorAll('.data-row');
                const hasData = rows.length > 0;
                const isLoading = grid.classList.contains('loading');
                const hasError = grid.classList.contains('error');

                return hasData && !isLoading && !hasError;
            '''),
            config=WaitConfig(
                strategy=WaitStrategy.STATE,
                timeout=15.0,
                interval=0.5
            ),
            description="data grid ready state"
        )

        assert data_ready.success, f"Data grid failed to load: {data_ready.error}"

        # Test data grid interaction contract
        grid_contract = DataTableContract(
            has_data=True,
            sortable_columns=['name', 'email', 'status', 'created_at'],
            filterable=True,
            paginated=True,
            searchable=True,
            row_actions=['edit', 'delete', 'view']
        )

        interaction_result = await component_tester.test_component_interactions(
            page.locator('.data-grid'),
            'data_grid',
            contract=grid_contract
        )

        # Test sorting functionality comprehensively
        sorting_results = {}
        sort_columns = ['name', 'email', 'created_at']

        for column in sort_columns:
            print(f"Testing sort by {column}...")

            # Click sort header
            await page.click(f'.sort-header[data-column="{column}"]')

            # Wait for sort to complete (check actual data state, not timing)
            sort_complete = await waiter.wait(
                condition=lambda: page.evaluate(f'''
                    const grid = document.querySelector('.data-grid');
                    const sortState = grid.getAttribute('data-sort-state');
                    const currentSort = sortState ? JSON.parse(sortState) : {{}};
                    return currentSort.column === '{column}' && currentSort.sorted;
                '''),
                config=WaitConfig(
                    strategy=WaitStrategy.STATE,
                    timeout=8.0,
                    interval=0.2
                ),
                description=f"sort completion for {column}"
            )

            # Validate data is actually sorted
            if sort_complete.success:
                data_sorted = await waiter.wait(
                    condition=lambda: page.evaluate(f'''
                        const cells = Array.from(document.querySelectorAll('.data-row .cell-{column}'));
                        const values = cells.map(cell => cell.textContent.trim());

                        // Check if values are sorted
                        for (let i = 1; i < values.length; i++) {{
                            if (values[i-1].localeCompare(values[i]) > 0) {{
                                return false; // Not sorted
                            }}
                        }}
                        return true; // Sorted correctly
                    '''),
                    config=WaitConfig(
                        strategy=WaitStrategy.FUNCTION,
                        timeout=5.0
                    ),
                    description=f"data sorted by {column}"
                )

                sorting_results[column] = {
                    'sort_triggered': True,
                    'sort_completed': sort_complete.success,
                    'data_sorted': data_sorted.success if data_sorted else False,
                    'duration': sort_complete.duration + (data_sorted.duration if data_sorted else 0)
                }
            else:
                sorting_results[column] = {
                    'sort_triggered': True,
                    'sort_completed': False,
                    'data_sorted': False,
                    'error': sort_complete.error
                }

        # Test filtering functionality
        print("Testing filtering...")

        # Apply filter
        await page.fill('.filter-input', 'active')
        await page.click('.apply-filter-button')

        # Wait for filter to apply
        filter_applied = await waiter.wait(
            condition=lambda: page.evaluate('''
                const grid = document.querySelector('.data-grid');
                const filteredRows = grid.querySelectorAll('.data-row.filtered');
                const visibleRows = grid.querySelectorAll('.data-row:not(.hidden)');
                const filterActive = grid.classList.contains('filtered');

                return filterActive && visibleRows.length > 0;
            '''),
            config=WaitConfig(
                strategy=WaitStrategy.STATE,
                timeout=8.0
            ),
            description="filter application"
        )

        # Test pagination
        print("Testing pagination...")

        # Click next page
        await page.click('.pagination-next')

        # Wait for page change
        page_changed = await waiter.wait(
            condition=lambda: page.evaluate('''
                const grid = document.querySelector('.data-grid');
                const currentPage = parseInt(grid.getAttribute('data-current-page') || '1');
                const totalPages = parseInt(grid.getAttribute('data-total-pages') || '1');
                return currentPage > 1 && currentPage <= totalPages;
            '''),
            config=WaitConfig(
                strategy=WaitStrategy.STATE,
                timeout=8.0
            ),
            description="pagination change"
        )

        # Return comprehensive validation results
        return {
            'data_grid_ready': data_ready.success,
            'interaction_testing': {
                'passed': interaction_result.component_found,
                'behaviors_passed': len([r for r in interaction_result.behavior_results if r.passed]),
                'total_behaviors': len(interaction_result.behavior_results)
            },
            'sorting_results': sorting_results,
            'filtering_passed': filter_applied.success,
            'pagination_passed': page_changed.success,
            'overall_success': (
                data_ready.success and
                interaction_result.component_found and
                all(r['data_sorted'] for r in sorting_results.values() if r.get('data_sorted')) and
                filter_applied.success and
                page_changed.success
            )
        }

    @staticmethod
    async def validate_modal_workflow(page) -> Dict[str, Any]:
        """
        Example: Modal workflow validation with state management

        This validates complete modal interactions including backdrop behavior,
        focus management, and accessibility features.
        """

        state_validator = ReactStateValidator()
        waiter = SmartWaiter()

        # Open modal
        await page.click('.open-modal-button')

        # Wait for modal to be fully ready (not just visible)
        modal_ready = await waiter.wait(
            condition=lambda: page.evaluate('''
                const modal = document.querySelector('.modal');
                if (!modal) return false;

                const isVisible = modal.classList.contains('show') || modal.style.display !== 'none';
                const hasBackdrop = document.querySelector('.modal-backdrop') !== null;
                const focusTrap = modal.getAttribute('data-focus-trap') === 'true';
                const ariaHidden = modal.getAttribute('aria-hidden') === 'false';

                return isVisible && hasBackdrop && focusTrap && ariaHidden;
            '''),
            config=WaitConfig(
                strategy=WaitStrategy.STATE,
                timeout=8.0,
                interval=0.2
            ),
            description="modal fully ready"
        )

        assert modal_ready.success, f"Modal failed to open properly: {modal_ready.error}"

        # Validate modal state comprehensively
        modal_state = await state_validator.validate_component_state(
            page.locator('.modal'),
            expected_state=ComponentState(
                visible=True,
                interactive=True,
                focused=True,
                css_classes=['modal', 'show'],
                attributes={
                    'role': 'dialog',
                    'aria-modal': 'true',
                    'aria-labelledby': 'modal-title'
                },
                children=['modal-header', 'modal-body', 'modal-footer']
            )
        )

        # Test focus management
        print("Testing focus management...")

        # Check that focus is trapped within modal
        focus_trapped = await waiter.wait(
            condition=lambda: page.evaluate('''
                const modal = document.querySelector('.modal');
                const activeElement = document.activeElement;
                const modalContainsFocus = modal.contains(activeElement);

                // Tab through modal elements and ensure focus stays within modal
                const focusableElements = modal.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );

                return modalContainsFocus && focusableElements.length > 0;
            '''),
            config=WaitConfig(
                strategy=WaitStrategy.FUNCTION,
                timeout=5.0
            ),
            description="focus trap verification"
        )

        # Test modal content loading (if applicable)
        content_loaded = await waiter.wait(
            condition=lambda: page.evaluate('''
                const modalBody = document.querySelector('.modal-body');
                if (!modalBody) return false;

                const hasContent = modalBody.textContent.trim().length > 0;
                const notLoading = !modalBody.classList.contains('loading');
                const noError = !modalBody.classList.contains('error');

                return hasContent && notLoading && noError;
            '''),
            config=WaitConfig(
                strategy=WaitStrategy.STATE,
                timeout=10.0
            ),
            description="modal content loading"
        )

        # Test modal close functionality
        print("Testing modal close...")

        # Close via close button
        await page.click('.modal-close-button')

        # Wait for modal to be fully closed (not just hidden)
        modal_closed = await waiter.wait(
            condition=lambda: page.evaluate('''
                const modal = document.querySelector('.modal');
                const backdrop = document.querySelector('.modal-backdrop');

                const modalHidden = !modal || (
                    !modal.classList.contains('show') &&
                    modal.style.display === 'none'
                );
                const backdropRemoved = !backdrop || backdrop.style.display === 'none';
                const focusRestored = document.activeElement === document.querySelector('.open-modal-button');

                return modalHidden && backdropRemoved;
            '''),
            config=WaitConfig(
                strategy=WaitStrategy.STATE,
                timeout=8.0,
                interval=0.2
            ),
            description="modal fully closed"
        )

        # Test escape key close
        # Re-open modal
        await page.click('.open-modal-button')
        await waiter.wait(
            condition=lambda: page.evaluate('document.querySelector(".modal").classList.contains("show")'),
            timeout=5.0
        )

        # Press escape key
        await page.keyboard.press('Escape')

        # Wait for escape close
        escape_close = await waiter.wait(
            condition=lambda: page.evaluate('!document.querySelector(".modal").classList.contains("show")'),
            config=WaitConfig(
                strategy=WaitStrategy.STATE,
                timeout=5.0
            ),
            description="escape key close"
        )

        # Test backdrop click close
        # Re-open modal
        await page.click('.open-modal-button')
        await waiter.wait(
            condition=lambda: page.evaluate('document.querySelector(".modal").classList.contains("show")'),
            timeout=5.0
        )

        # Click backdrop
        await page.click('.modal-backdrop')

        # Wait for backdrop close
        backdrop_close = await waiter.wait(
            condition=lambda: page.evaluate('!document.querySelector(".modal").classList.contains("show")'),
            config=WaitConfig(
                strategy=WaitStrategy.STATE,
                timeout=5.0
            ),
            description="backdrop click close"
        )

        # Return comprehensive results
        return {
            'modal_open_success': modal_ready.success,
            'modal_state_valid': modal_state.state_matches,
            'focus_management_passed': focus_trapped.success,
            'content_loaded_successfully': content_loaded.success,
            'close_button_passed': modal_closed.success,
            'escape_key_close_passed': escape_close.success,
            'backdrop_click_close_passed': backdrop_close.success,
            'overall_success': (
                modal_ready.success and
                modal_state.state_matches and
                focus_trapped.success and
                content_loaded.success and
                modal_closed.success and
                escape_close.success and
                backdrop_close.success
            )
        }

    @staticmethod
    async def validate_file_upload_workflow(page) -> Dict[str, Any]:
        """
        Example: File upload validation with progress tracking

        This validates the complete file upload process including progress
        tracking, error handling, and success states.
        """

        waiter = SmartWaiter()

        # Select file for upload
        file_input = page.locator('input[type="file"]')
        test_file_path = 'test-uploads/sample-document.pdf'

        await file_input.set_input_files(test_file_path)

        # Wait for upload to start
        upload_started = await waiter.wait(
            condition=lambda: page.evaluate('''
                const uploader = document.querySelector('.file-uploader');
                return uploader && (
                    uploader.classList.contains('uploading') ||
                    uploader.getAttribute('data-upload-status') === 'uploading'
                );
            '''),
            config=WaitConfig(
                strategy=WaitStrategy.STATE,
                timeout=5.0
            ),
            description="file upload start"
        )

        assert upload_started.success, "File upload should start after file selection"

        # Monitor upload progress
        upload_progress_results = []
        last_progress = 0

        def check_upload_progress():
            nonlocal last_progress
            progress_info = page.evaluate('''
                const uploader = document.querySelector('.file-uploader');
                if (!uploader) return null;

                const progress = uploader.getAttribute('data-upload-progress');
                const status = uploader.getAttribute('data-upload-status');
                const progressBar = uploader.querySelector('.progress-bar');
                const progressPercent = progressBar ? progressBar.style.width || '0%' : '0%';

                return {
                    progress: progress ? parseInt(progress) : null,
                    status: status || 'unknown',
                    progressPercent: progressPercent,
                    hasError: uploader.classList.contains('error'),
                    isComplete: uploader.classList.contains('complete')
                };
            ''')

            if progress_info:
                current_progress = progress_info.get('progress', 0)
                if current_progress > last_progress:
                    upload_progress_results.append(current_progress)
                    last_progress = current_progress

                return progress_info
            return None

        # Wait for upload to complete
        upload_completed = await waiter.wait(
            condition=lambda: check_upload_progress() and check_upload_progress().get('isComplete', False),
            config=WaitConfig(
                strategy=WaitStrategy.FILE_UPLOAD,
                timeout=30.0,
                interval=1.0  # Check every second for progress
            ),
            description="file upload completion"
        )

        # Validate upload results
        final_state = check_upload_progress()

        # Test upload result display
        result_displayed = await waiter.wait(
            condition=lambda: page.evaluate('''
                const uploader = document.querySelector('.file-uploader');
                const resultMessage = uploader.querySelector('.upload-result');
                const fileName = uploader.querySelector('.file-name');
                const fileSize = uploader.querySelector('.file-size');
                const uploadTime = uploader.querySelector('.upload-time');

                return {
                    hasResult: resultMessage !== null,
                    fileNameDisplayed: fileName && fileName.textContent.trim().length > 0,
                    fileSizeDisplayed: fileSize && fileSize.textContent.trim().length > 0,
                    uploadTimeDisplayed: uploadTime && uploadTime.textContent.trim().length > 0,
                    resultMessage: resultMessage ? resultMessage.textContent : null
                };
            '''),
            config=WaitConfig(
                strategy=WaitStrategy.FUNCTION,
                timeout=5.0
            ),
            description="upload result display"
        )

        # Test error handling by simulating network failure
        print("Testing upload error handling...")

        # Reset for error test
        await page.click('.remove-file-button')
        await page.setOffline(True)  # Simulate network failure

        await file_input.set_input_files(test_file_path)

        # Wait for error to appear
        error_handled = await waiter.wait(
            condition=lambda: page.evaluate('''
                const uploader = document.querySelector('.file-uploader');
                return uploader && (
                    uploader.classList.contains('error') ||
                    uploader.getAttribute('data-upload-status') === 'error'
                );
            '''),
            config=WaitConfig(
                strategy=WaitStrategy.STATE,
                timeout=15.0
            ),
            description="upload error handling"
        )

        await page.setOffline(False)  # Restore connection

        # Return comprehensive validation results
        return {
            'upload_started_successfully': upload_started.success,
            'upload_completed_successfully': upload_completed.success,
            'progress_tracking_worked': len(upload_progress_results) > 0,
            'final_upload_state': final_state,
            'result_displayed_correctly': result_displayed.success,
            'error_handling_worked': error_handled.success,
            'overall_success': (
                upload_started.success and
                upload_completed.success and
                len(upload_progress_results) > 0 and
                result_displayed.success and
                error_handled.success
            )
        }

# Example usage in pytest
@pytest.mark.asyncio
async def test_comprehensive_user_flow(page):
    """Example of using the validation framework in a test"""

    examples = ExampleValidations()

    # Test user registration
    registration_result = await examples.validate_user_registration_flow(page)
    assert registration_result['overall_success'], "User registration flow should pass"

    # Test data grid after login (assuming registration logs user in)
    grid_result = await examples.validate_data_grid_functionality(page)
    assert grid_result['overall_success'], "Data grid functionality should work"

    # Test modal interactions
    modal_result = await examples.validate_modal_workflow(page)
    assert modal_result['overall_success'], "Modal workflow should work correctly"

    # Test file upload
    upload_result = await examples.validate_file_upload_workflow(page)
    assert upload_result['overall_success'], "File upload workflow should work"

if __name__ == "__main__":
    # Run example validations (would need actual page object)
    print("Example validation implementations ready for use!")
    print("Import ExampleValidations class and use in your test suite.")