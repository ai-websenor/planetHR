Feature: Personality Analysis Reports (Role Specific)
  As a user
  I want to Personality analysis reports (role specific)
  So that I can achieve my goals

  Background:
    Given the monolithic application is running
    And I am authenticated

  @report-generation @personality-analysis-reports-(role-specific)
  Scenario: Successfully Personality analysis reports (role specific)
    Given I have the necessary permissions
    When I perform the action
    Then the operation should succeed
    And I should see confirmation

  # Additional scenarios to be documented
