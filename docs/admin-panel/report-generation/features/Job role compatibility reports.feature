Feature: Job Role Compatibility Reports
  As a user
  I want to Job role compatibility reports
  So that I can achieve my goals

  Background:
    Given the monolithic application is running
    And I am authenticated

  @report-generation @job-role-compatibility-reports
  Scenario: Successfully Job role compatibility reports
    Given I have the necessary permissions
    When I perform the action
    Then the operation should succeed
    And I should see confirmation

  # Additional scenarios to be documented
