Feature: Role Based Report Access
  As a user
  I want to Role based report access
  So that I can achieve my goals

  Background:
    Given the monolithic application is running
    And I am authenticated

  @report-generation @role-based-report-access
  Scenario: Successfully Role based report access
    Given I have the necessary permissions
    When I perform the action
    Then the operation should succeed
    And I should see confirmation

  # Additional scenarios to be documented
