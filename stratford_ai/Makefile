# Stratford AI - Deterministic Build Makefile
#
# This Makefile provides standardized commands for development,
# testing, and deployment following deterministic build principles.

.PHONY: bootstrap dev build test test-ui lint format type-check clean help

# Default target
help:
	@echo "Stratford AI - Available Commands:"
	@echo ""
	@echo "  bootstrap    Install dependencies and setup environment"
	@echo "  dev          Start development server"
	@echo "  build        Build production bundle"
	@echo "  test         Run unit tests"
	@echo "  test-ui      Run tests with UI"
	@echo "  lint         Run ESLint"
	@echo "  format       Format code with Prettier"
	@echo "  type-check   Run TypeScript type checking"
	@echo "  clean        Clean build artifacts and dependencies"
	@echo "  verify       Run all quality checks (lint + type-check + test)"
	@echo ""

# Environment setup
bootstrap:
	@echo "🏗️  Setting up Stratford AI development environment..."
	@pnpm install
	@echo "✅ Bootstrap complete"

# Development
dev:
	@echo "🚀 Starting development server..."
	@pnpm dev

# Production build
build:
	@echo "📦 Building production bundle..."
	@pnpm build

# Testing
test:
	@echo "🧪 Running unit tests..."
	@pnpm test

test-ui:
	@echo "🧪 Running tests with UI..."
	@pnpm test --ui

# Code quality
lint:
	@echo "🔍 Running ESLint..."
	@pnpm lint

format:
	@echo "✨ Formatting code..."
	@pnpm format

format-check:
	@echo "🔍 Checking code formatting..."
	@pnpm format:check

type-check:
	@echo "🔍 Running TypeScript type checking..."
	@pnpm type-check

# Combined quality check
verify: lint type-check test
	@echo "✅ All quality checks passed"

# Cleanup
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf .next
	@rm -rf node_modules
	@rm -rf dist
	@echo "✅ Clean complete"

# Development workflow
start: bootstrap verify dev