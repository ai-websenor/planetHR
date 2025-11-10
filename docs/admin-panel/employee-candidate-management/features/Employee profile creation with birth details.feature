Feature: Employee Profile Creation With Birth Details
  As a user
  I want to Employee profile creation with birth details
  So that I can achieve my goals

  Background:
    Given the monolithic application is running
    And I am authenticated

  @employee-candidate-management @employee-profile-creation-with-birth-details
  Scenario: Successfully Employee profile creation with birth details
    Given I have the necessary permissions
    When I perform the action
    Then the operation should succeed
    And I should see confirmation

  # Additional scenarios to be documented
