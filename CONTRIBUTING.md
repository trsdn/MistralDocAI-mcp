# Contributing to MistralDocAI MCP Server

We welcome contributions to the MistralDocAI MCP Server! This document provides guidelines for contributing.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/MistralDocAI-mcp.git
   cd MistralDocAI-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp python/.env.example python/.env
   # Add your MISTRAL_API_KEY to python/.env
   ```

4. **Build and test**
   ```bash
   npm run build
   npm test
   ```

## Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow existing code style
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run build
   npm test
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: describe your changes"
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**

## Code Style

- **TypeScript**: Follow existing patterns in `src/`
- **Python**: Follow PEP 8 standards in `python/`
- **Documentation**: Update README.md for user-facing changes

## Testing

- Run `npm test` to test the full setup
- Test with different document formats when possible
- Ensure cross-platform compatibility

## Commit Message Format

We use conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## Questions?

Feel free to open an issue for questions or discussion!