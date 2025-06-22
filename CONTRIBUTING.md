# Contributing to Early Autism Detector

Thank you for your interest in contributing to the Early Autism Detector project! This document provides guidelines and information for contributors.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Community](#community)

## Code of Conduct

### Our Pledge
We are committed to making participation in this project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards
Examples of behavior that contributes to creating a positive environment include:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

### Unacceptable Behavior
Examples of unacceptable behavior include:
- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

## Getting Started

### Prerequisites
- Node.js 18.0.0 or later
- npm 9.0.0 or later
- Git
- Basic knowledge of React, TypeScript, and Next.js

### Development Setup
1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/early_autism_detection.git
   cd early_autism_detection
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up environment variables (see [Environment Setup Guide](docs/ENVIRONMENT_SETUP.md))
5. Start the development server:
   ```bash
   npm run dev
   ```

## Development Process

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

### Workflow
1. Create a new branch from `main` for your feature/fix
2. Make your changes with appropriate tests
3. Ensure all tests pass and code follows style guidelines
4. Submit a pull request with a clear description

### Commit Messages
Use conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(assessment): add progress tracking dashboard
fix(auth): resolve login redirect issue
docs(api): update endpoint documentation
```

## Coding Standards

### TypeScript
- Use strict TypeScript configuration
- Define interfaces for all props and data structures
- Avoid `any` type; use proper typing
- Use type guards for runtime type checking

### React Components
- Use functional components with hooks
- Extract custom hooks for reusable logic
- Implement proper error boundaries
- Follow component composition patterns

### Styling
- Use Tailwind CSS for styling
- Follow mobile-first responsive design
- Maintain consistent spacing and typography
- Use semantic HTML elements

### Testing
- Write unit tests for utility functions
- Add integration tests for API endpoints
- Include component tests for complex UI logic
- Maintain minimum 80% test coverage

### Code Quality
- Run ESLint and fix all warnings
- Format code with Prettier
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

## Pull Request Process

### Before Submitting
1. **Test your changes**:
   ```bash
   npm test
   npm run type-check
   npm run lint
   ```

2. **Update documentation** if needed

3. **Add tests** for new functionality

4. **Check accessibility** compliance

### PR Requirements
- Clear, descriptive title
- Detailed description of changes
- Link to related issues
- Screenshots for UI changes
- Test coverage maintained or improved

### Review Process
1. Automated checks must pass
2. At least one maintainer review required
3. Address all review feedback
4. Squash commits before merging

## Issue Reporting

### Bug Reports
Include the following information:
- **Description**: Clear description of the bug
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Environment**: Browser, OS, Node.js version
- **Screenshots**: If applicable

### Feature Requests
Include the following information:
- **Problem**: What problem does this solve?
- **Solution**: Describe your proposed solution
- **Alternatives**: Alternative solutions considered
- **Additional Context**: Any other relevant information

### Issue Labels
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements to documentation
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention needed
- `priority: high` - High priority issue

## Community

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Pull Requests**: Code review and collaboration

### Getting Help
- Check existing documentation first
- Search existing issues and discussions
- Ask questions in GitHub Discussions
- Be patient and respectful when asking for help

### Recognition
Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Special recognition for long-term contributors

## Development Guidelines

### Performance
- Optimize bundle size with code splitting
- Use React.memo for expensive components
- Implement proper loading states
- Optimize database queries

### Security
- Validate all user inputs
- Use environment variables for secrets
- Implement proper authentication checks
- Follow OWASP security guidelines

### Accessibility
- Use semantic HTML elements
- Provide alt text for images
- Ensure keyboard navigation works
- Test with screen readers
- Maintain proper color contrast

### Internationalization
- Use translation keys for all user-facing text
- Support RTL languages
- Consider cultural differences in design
- Test with different locales

## Release Process

### Versioning
We use Semantic Versioning (SemVer):
- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes (backward compatible)

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Version number bumped
- [ ] Changelog updated
- [ ] Security review completed
- [ ] Performance benchmarks met

## Questions?

If you have questions about contributing, please:
1. Check the documentation
2. Search existing issues and discussions
3. Create a new discussion if needed

Thank you for contributing to Early Autism Detector! Your efforts help families and children affected by autism spectrum disorders.
