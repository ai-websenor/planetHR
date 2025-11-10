Feature: Birth Chart Calculation
  As a user
  I want to Birth chart calculation
  So that I can achieve my goals

  Background:
    Given the monolithic application is running
    And I am authenticated

  @astrology-harmonic-engine @birth-chart-calculation
  Scenario: Successfully Birth chart calculation
    Given I have the necessary permissions
    When I perform the action
    Then the operation should succeed
    And I should see confirmation

  # Additional scenarios to be documented
