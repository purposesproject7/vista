// src/features/faculty/pages/tutorial/FacultyTutorial.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TutorialNavigation from '../../components/tutorial/TutorialNavigation';
import TutorialStep from '../../components/tutorial/TutorialStep';
import TutorialHighlight from '../../components/tutorial/TutorialHighlight';
import FilterPanel from '../../components/FilterPanel';
import StatisticsCard from '../../components/StatisticsCard';
import ActiveReviewsSection from '../../components/ActiveReviewsSection';
import DeadlinePassedSection from '../../components/DeadlinePassedSection';
import PastReviewsSection from '../../components/PastReviewsSection';
import {
  UserCircleIcon,
  KeyIcon,
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  FunnelIcon,
  CheckCircleIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';

const FacultyTutorial = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [filters, setFilters] = useState({
    year: '',
    school: '',
    programme: '',
    type: ''
  });

  // Mock data for tutorial
  const mockActiveReviews = [
    {
      id: 1,
      name: 'Interim Review - Computer Science',
      endDate: '2025-01-30',
      teams: [
        {
          id: 1,
          name: 'Team Alpha',
          marksEntered: false,
          students: [
            { id: 1, name: 'John Doe', rollNumber: '21BCE001' },
            { id: 2, name: 'Jane Smith', rollNumber: '21BCE002' }
          ]
        },
        {
          id: 2,
          name: 'Team Beta',
          marksEntered: true,
          students: [
            { id: 3, name: 'Bob Johnson', rollNumber: '21BCE003' }
          ]
        }
      ]
    }
  ];

  const mockDeadlinePassed = [
    {
      id: 2,
      name: 'Final Review - Information Technology',
      endDate: '2025-01-15',
      teams: [
        {
          id: 3,
          name: 'Team Gamma',
          marksEntered: false,
          students: [
            { id: 4, name: 'Alice Brown', rollNumber: '21BIT001' }
          ]
        }
      ]
    }
  ];

  const mockPastReviews = [
    {
      id: 3,
      name: 'Interim Review - Electronics',
      endDate: '2025-01-10',
      teams: [
        {
          id: 4,
          name: 'Team Delta',
          marksEntered: true,
          students: [
            { id: 5, name: 'Charlie Wilson', rollNumber: '21BEC001' }
          ]
        }
      ]
    }
  ];

  const tutorialSteps = [
    {
      title: 'Welcome to Faculty Dashboard',
      component: 'welcome'
    },
    {
      title: 'User Menu & Account Settings',
      component: 'userMenu'
    },
    {
      title: 'Understanding the Filter System',
      component: 'filters'
    },
    {
      title: 'Review Statistics Overview',
      component: 'statistics'
    },
    {
      title: 'Managing Active Reviews',
      component: 'activeReviews'
    },
    {
      title: 'Handling Overdue Reviews',
      component: 'deadlinePassed'
    },
    {
      title: 'Viewing Past Reviews',
      component: 'pastReviews'
    },
    {
      title: 'Tutorial Complete',
      component: 'complete'
    }
  ];

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/faculty');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    navigate('/faculty');
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const renderStepContent = () => {
    const step = tutorialSteps[currentStep];

    switch (step.component) {
      case 'welcome':
        return (
          <div className="max-w-4xl mx-auto">
            <TutorialStep
              title="Welcome to the Faculty Dashboard Tutorial!"
              description="This interactive tutorial will guide you through all the features of the VISTA Faculty Dashboard. You'll learn how to navigate the system, manage reviews, and efficiently handle your faculty responsibilities."
              variant="highlight"
              tips={[
                "Take your time to understand each feature",
                "You can navigate back and forth between steps",
                "Real interactions are demonstrated with sample data",
                "Press 'Next' to continue when you're ready"
              ]}
              nextSteps={[
                "Learn about user account management",
                "Understand the filter system",
                "Explore review management features",
                "Practice with sample data"
              ]}
            />
          </div>
        );

      case 'userMenu':
        return (
          <div className="space-y-6">
            <TutorialStep
              title="User Menu & Account Management"
              description="Your user menu is located in the top-right corner of the screen. It provides access to essential account functions and security features."
              tips={[
                "Always logout when using shared computers",
                "Change your password regularly for security",
                "Your role and permissions are displayed here"
              ]}
              warnings={[
                "Never share your login credentials with anyone",
                "Report suspicious account activity immediately"
              ]}
            />

            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-blue-600">VISTA</h1>
                  <p className="text-sm text-gray-600 mt-1">Faculty Dashboard</p>
                </div>

                <TutorialHighlight
                  title="User Profile Menu"
                  description="Click here to access your profile settings, change password, start tutorials, and logout securely."
                  variant="interactive"
                  position="left"
                >
                  <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                    <UserCircleIcon className="w-6 h-6 text-blue-600" />
                    <div className="text-right">
                      <p className="font-semibold text-sm text-gray-900">Dr. Faculty Demo</p>
                      <p className="text-xs text-gray-500">faculty.demo@vit.ac.in</p>
                    </div>
                  </div>
                </TutorialHighlight>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 mb-3">Available Menu Options:</h3>

                <TutorialHighlight
                  title="Change Password"
                  description="Update your login password to keep your account secure. Use strong passwords with numbers, symbols, and mixed case."
                  variant="default"
                  position="right"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-700 p-2 rounded hover:bg-gray-50">
                    <KeyIcon className="w-4 h-4 text-gray-500" />
                    Change Password
                  </div>
                </TutorialHighlight>

                <TutorialHighlight
                  title="Tutorial Access"
                  description="Return to this tutorial anytime or access quick help guides for specific features."
                  variant="default"
                  position="right"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-700 p-2 rounded hover:bg-gray-50">
                    <AcademicCapIcon className="w-4 h-4 text-gray-500" />
                    Walkthrough/Tutorial
                  </div>
                </TutorialHighlight>

                <TutorialHighlight
                  title="Secure Logout"
                  description="Always use this button to logout safely. This clears your session and protects your account."
                  variant="important"
                  position="right"
                >
                  <div className="flex items-center gap-2 text-sm text-red-600 p-2 rounded hover:bg-red-50 border-t border-gray-200 pt-3 mt-3">
                    <ArrowRightOnRectangleIcon className="w-4 h-4 text-red-500" />
                    Logout
                  </div>
                </TutorialHighlight>
              </div>
            </div>
          </div>
        );

      case 'filters':
        return (
          <div className="space-y-6">
            <TutorialStep
              title="Filter System - Your Gateway to Reviews"
              description="The filter system is the heart of the dashboard. You MUST select all four filters (Year, School, Programme, Type) before you can view any reviews. This ensures you only see relevant data."
              variant="highlight"
              tips={[
                "Filters are applied sequentially - each depends on the previous selection",
                "The progress bar shows your completion status",
                "Only years/schools with active reviews will appear in dropdowns",
                "Your role determines which programmes you can access"
              ]}
              warnings={[
                "You cannot access reviews until ALL filters are selected",
                "Changing any filter will reset subsequent filters",
                "Some combinations may have no available reviews"
              ]}
              nextSteps={[
                "Select the academic year you want to review",
                "Choose your assigned school/faculty",
                "Pick the specific programme",
                "Select your review type (Guide or Panel)"
              ]}
            />

            <TutorialHighlight
              title="Filter Panel"
              description="This is where you select your review criteria. Notice the progress bar and step counter. All fields must be completed to proceed."
              variant="important"
              position="bottom"
            >
              <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
            </TutorialHighlight>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Filter Dependencies</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Year → Enables School selection</li>
                  <li>• School → Enables Programme selection</li>
                  <li>• Programme → Enables Type selection</li>
                  <li>• All complete → Shows reviews</li>
                </ul>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Review Types</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• <strong>Guide:</strong> You are the project guide</li>
                  <li>• <strong>Panel:</strong> You are a panel member</li>
                  <li>• Different marking criteria may apply</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'statistics':
        return (
          <div className="space-y-6">
            <TutorialStep
              title="Statistics Overview - Your Review Workload"
              description="The statistics cards give you a quick overview of your review responsibilities. Use these numbers to prioritize your work and manage deadlines effectively."
              tips={[
                "Focus on overdue reviews first to avoid delays",
                "Active reviews show current opportunities to enter marks",
                "Completed reviews are your historical record",
                "Colors help you quickly identify urgent items"
              ]}
              warnings={[
                "Overdue reviews (orange) need immediate attention",
                "Missing deadlines can delay student results"
              ]}
            />

            <TutorialHighlight
              title="Review Statistics"
              description="These cards show your current workload. Blue = active within deadline, Orange = overdue/urgent, Green = completed successfully."
              variant="default"
              position="bottom"
            >
              <StatisticsCard
                active={mockActiveReviews}
                deadlinePassed={mockDeadlinePassed}
                past={mockPastReviews}
              />
            </TutorialHighlight>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Understanding the Numbers:</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-700 mb-2">1</div>
                  <div className="text-sm text-gray-600">
                    <strong>Active Reviews:</strong> Currently within deadline period
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-700 mb-2">1</div>
                  <div className="text-sm text-gray-600">
                    <strong>Overdue:</strong> Past deadline, needs immediate attention
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-700 mb-2">1</div>
                  <div className="text-sm text-gray-600">
                    <strong>Completed:</strong> Successfully submitted reviews
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'activeReviews':
        return (
          <div className="space-y-6">
            <TutorialStep
              title="Active Reviews - Current Assessment Opportunities"
              description="Active reviews are within their deadline period and ready for your assessment. This is where you'll spend most of your time entering marks and providing feedback to students."
              tips={[
                "Click on review headers to expand and see team details",
                "Teams with green checkmarks have completed assessments",
                "Use 'Enter Marks' to open the detailed marking interface",
                "You can save drafts and return to complete assessments later"
              ]}
              warnings={[
                "Pay attention to approaching deadlines",
                "Ensure all team members are assessed individually",
                "Double-check marks before final submission"
              ]}
              nextSteps={[
                "Expand a review to see all assigned teams",
                "Click 'Enter Marks' for any incomplete team",
                "Use the rubric to assess each evaluation criteria",
                "Provide constructive written feedback"
              ]}
            />

            <TutorialHighlight
              title="Active Reviews Section"
              description="Reviews currently within deadline. Expand any review to see teams and their completion status."
              variant="interactive"
              position="bottom"
            >
              <ActiveReviewsSection
                reviews={mockActiveReviews}
                onEnterMarks={(team) => {
                  alert(`Demo: Would open marking interface for ${team.name}. In the real system, this opens a comprehensive assessment form with rubrics and individual student marking.`);
                }}
              />
            </TutorialHighlight>

            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="font-semibold text-blue-900 mb-3">Assessment Process:</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full w-6 h-6 flex items-center justify-center">1</span>
                  <div>
                    <strong className="text-blue-900">Select Team:</strong>
                    <p className="text-blue-800 text-sm">Click "Enter Marks" on any team that needs assessment</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full w-6 h-6 flex items-center justify-center">2</span>
                  <div>
                    <strong className="text-blue-900">Use Rubrics:</strong>
                    <p className="text-blue-800 text-sm">Assess each criterion using the provided performance levels</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full w-6 h-6 flex items-center justify-center">3</span>
                  <div>
                    <strong className="text-blue-900">Individual Assessment:</strong>
                    <p className="text-blue-800 text-sm">Mark each team member individually based on their contribution</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full w-6 h-6 flex items-center justify-center">4</span>
                  <div>
                    <strong className="text-blue-900">Provide Feedback:</strong>
                    <p className="text-blue-800 text-sm">Write detailed, constructive comments to help students improve</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'deadlinePassed':
        return (
          <div className="space-y-6">
            <TutorialStep
              title="Overdue Reviews - Urgent Action Required"
              description="These reviews have passed their deadline but can still be completed. They require immediate attention to avoid delaying student results and academic schedules."
              variant="warning"
              tips={[
                "Complete overdue reviews as your top priority",
                "Contact administration if you need deadline extensions",
                "These reviews are highlighted in orange/red for visibility"
              ]}
              warnings={[
                "Delayed reviews can impact student graduation timelines",
                "Multiple overdue reviews may require explanation to administration",
                "Some overdue reviews may have restricted access after extended periods"
              ]}
              nextSteps={[
                "Complete overdue assessments immediately",
                "Contact students/supervisors if clarification is needed",
                "Submit marks even if incomplete rather than further delay"
              ]}
            />

            <TutorialHighlight
              title="Overdue Reviews"
              description="These reviews are past their deadline and need immediate attention. The orange highlighting indicates urgency."
              variant="important"
              position="bottom"
            >
              <DeadlinePassedSection
                reviews={mockDeadlinePassed}
                onEnterMarks={(team) => {
                  alert(`Demo: Would open urgent marking interface for ${team.name}. Note: This is overdue and needs immediate attention!`);
                }}
              />
            </TutorialHighlight>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <h4 className="font-semibold text-orange-900 mb-3">Handling Overdue Reviews:</h4>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <h5 className="font-medium text-orange-900 mb-2">Immediate Actions:</h5>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>✓ Complete assessment as soon as possible</li>
                    <li>✓ Contact administration if there are issues</li>
                    <li>✓ Prioritize these over active reviews</li>
                    <li>✓ Document any special circumstances</li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <h5 className="font-medium text-orange-900 mb-2">Prevention Tips:</h5>
                  <ul className="text-sm text-orange-800 space-y-1">
                    <li>• Set calendar reminders for upcoming deadlines</li>
                    <li>• Check the dashboard regularly for new assignments</li>
                    <li>• Complete reviews well before deadlines when possible</li>
                    <li>• Communicate early if you anticipate delays</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'pastReviews':
        return (
          <div className="space-y-6">
            <TutorialStep
              title="Past Reviews - Your Assessment History"
              description="Past reviews show your completed assessments. This section is useful for reference, checking your previous decisions, and maintaining records of your assessment activities."
              tips={[
                "Use past reviews as reference for similar projects",
                "Check consistency in your marking approaches",
                "This serves as your assessment portfolio",
                "All submitted marks and feedback are preserved here"
              ]}
              warnings={[
                "Past reviews are generally read-only",
                "Changes to submitted marks require special approval",
                "Keep personal records of significant assessment decisions"
              ]}
            />

            <TutorialHighlight
              title="Completed Reviews"
              description="Your assessment history. These are read-only records of previously completed reviews with submitted marks and feedback."
              variant="default"
              position="bottom"
            >
              <PastReviewsSection reviews={mockPastReviews} />
            </TutorialHighlight>

            <div className="bg-green-50 rounded-lg p-6">
              <h4 className="font-semibold text-green-900 mb-3">Benefits of Review History:</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h5 className="font-medium text-green-900">For Reference:</h5>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Compare similar project types</li>
                    <li>• Maintain marking consistency</li>
                    <li>• Reference previous feedback styles</li>
                    <li>• Track your assessment patterns</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h5 className="font-medium text-green-900">For Records:</h5>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Permanent assessment archive</li>
                    <li>• Audit trail for marks given</li>
                    <li>• Evidence of completed responsibilities</li>
                    <li>• Historical workload documentation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="max-w-4xl mx-auto text-center">
            <TutorialStep
              title="🎉 Tutorial Complete!"
              description="Congratulations! You've successfully completed the Faculty Dashboard tutorial. You now understand all the key features and are ready to efficiently manage your review responsibilities."
              variant="success"
              tips={[
                "You can return to this tutorial anytime from the user menu",
                "Start by selecting your filters to see real review data",
                "Focus on overdue reviews first, then active reviews",
                "Contact support if you encounter any issues"
              ]}
              nextSteps={[
                "Go to the real Faculty Dashboard",
                "Select your year, school, programme, and type filters",
                "Begin with any overdue reviews (if any)",
                "Complete active reviews before their deadlines",
                "Use past reviews as reference when needed"
              ]}
            />

            <div className="mt-8 p-6 bg-blue-50 rounded-xl">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Quick Reference Summary:</h3>
              <div className="grid grid-cols-2 gap-6 text-left">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Essential Steps:</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Select all four filters</li>
                    <li>2. Check statistics for overview</li>
                    <li>3. Handle overdue reviews first</li>
                    <li>4. Complete active reviews</li>
                    <li>5. Provide detailed feedback</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Key Features:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Filter system (mandatory)</li>
                    <li>• Statistics overview</li>
                    <li>• Interactive marking interface</li>
                    <li>• Individual student assessment</li>
                    <li>• Comprehensive rubrics</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <p className="text-gray-700 text-sm">
                <strong>Need Help?</strong> Access this tutorial again from the user menu → "Walkthrough/Tutorial" or contact the system administrator for technical support.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TutorialNavigation
        currentStep={currentStep}
        totalSteps={tutorialSteps.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onClose={handleClose}
        stepTitle={tutorialSteps[currentStep].title}
        canGoNext={true}
        canGoPrevious={currentStep > 0}
      />

      <div className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
};

export default FacultyTutorial;
