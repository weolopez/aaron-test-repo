---
name: test-skill
description: A test skill for workspace integration testing
---

# Test Skill

This skill is used to verify that project-specific skills are correctly loaded and merged.

## When to use

Use this skill when running integration tests for the workspace module.

## Approach

1. Verify the skill was loaded from /project-skills/
2. Confirm project skills take precedence over core skills
3. Test skill merging behavior
