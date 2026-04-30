/**
 * Custom ESLint rules for project-specific patterns
 * These enforce patterns from Cursor rules and architectural standards
 */

module.exports = {
  rules: {
    /**
     * Enforces that service functions return ApiResponse<T>
     * Services in src/services/ should always return Promise<ApiResponse<T>>
     */
    'service-returns-api-response': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Service functions must return Promise<ApiResponse<T>>',
          category: 'Best Practices',
        },
        fixable: null,
        schema: [],
      },
      create(context) {
        const filename = context.getFilename();
        const isServiceFile =
          filename.includes('/services/') && filename.endsWith('.ts');

        if (!isServiceFile) {
          return {};
        }

        return {
          FunctionDeclaration(node) {
            if (node.async) {
              const returnType = node.returnType;
              if (
                returnType &&
                returnType.typeAnnotation &&
                returnType.typeAnnotation.type === 'TSTypeReference'
              ) {
                const typeName =
                  returnType.typeAnnotation.typeName?.name ||
                  returnType.typeAnnotation.typeName;
                if (typeName === 'Promise') {
                  const typeArgs =
                    returnType.typeAnnotation.typeParameters?.params;
                  if (
                    typeArgs &&
                    typeArgs.length > 0 &&
                    typeArgs[0].type === 'TSTypeReference'
                  ) {
                    const innerTypeName =
                      typeArgs[0].typeName?.name || typeArgs[0].typeName;
                    if (innerTypeName !== 'ApiResponse') {
                      context.report({
                        node: returnType,
                        message:
                          'Service functions must return Promise<ApiResponse<T>>',
                      });
                    }
                  }
                }
              } else if (!returnType) {
                context.report({
                  node,
                  message:
                    'Service functions must have explicit return type: Promise<ApiResponse<T>>',
                });
              }
            }
          },
          ArrowFunctionExpression(node) {
            if (node.async && node.parent.type === 'VariableDeclarator') {
              const parent = node.parent;
              if (parent.id && parent.id.typeAnnotation) {
                const returnType = parent.id.typeAnnotation.typeAnnotation;
                if (
                  returnType &&
                  returnType.type === 'TSTypeReference' &&
                  returnType.typeName?.name === 'Promise'
                ) {
                  const typeArgs = returnType.typeParameters?.params;
                  if (
                    typeArgs &&
                    typeArgs.length > 0 &&
                    typeArgs[0].type === 'TSTypeReference'
                  ) {
                    const innerTypeName =
                      typeArgs[0].typeName?.name || typeArgs[0].typeName;
                    if (innerTypeName !== 'ApiResponse') {
                      context.report({
                        node: parent.id.typeAnnotation,
                        message:
                          'Service functions must return Promise<ApiResponse<T>>',
                      });
                    }
                  }
                }
              }
            }
          },
        };
      },
    },

    /**
     * Warns about inline styles (except for dynamic values)
     * From Frontend Quality Constitution: "No inline styles except for truly dynamic values"
     */
    'no-inline-styles': {
      meta: {
        type: 'suggestion',
        docs: {
          description:
            'Avoid inline styles except for truly dynamic values',
          category: 'Best Practices',
        },
        fixable: null,
        schema: [],
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (
              node.name &&
              node.name.name === 'style' &&
              node.value &&
              node.value.type === 'JSXExpressionContainer'
            ) {
              const expression = node.value.expression;
              // Allow object expressions with dynamic values
              if (expression.type === 'ObjectExpression') {
                const hasOnlyDynamicValues = expression.properties.every(
                  (prop) => {
                    if (prop.type === 'Property') {
                      const value = prop.value;
                      const key = prop.key.name || prop.key.value;
                      // Allow animation-related properties (necessary for dynamic animations)
                      if (
                        key === 'animationDelay' ||
                        key === 'animationDuration' ||
                        key === 'transitionDelay'
                      ) {
                        return true;
                      }
                      // Allow if value is a function call, identifier, member expression, or template literal
                      return (
                        value.type === 'CallExpression' ||
                        value.type === 'Identifier' ||
                        value.type === 'MemberExpression' ||
                        value.type === 'ConditionalExpression' ||
                        value.type === 'TemplateLiteral' ||
                        (value.type === 'Literal' &&
                          typeof value.value === 'string' &&
                          (value.value.includes('%') ||
                            value.value.includes('calc') ||
                            value.value.includes('var(')))
                      );
                    }
                    return false;
                  }
                );

                if (!hasOnlyDynamicValues) {
                  context.report({
                    node,
                    message:
                      'Avoid inline styles with static values. Use Tailwind classes or CSS modules instead.',
                  });
                }
              } else if (expression.type === 'Literal') {
                context.report({
                  node,
                  message:
                    'Avoid inline styles with static values. Use Tailwind classes or CSS modules instead.',
                });
              }
            }
          },
        };
      },
    },

    /**
     * Ensures components handle loading/error states
     * Checks for common patterns like isLoading, error, etc.
     */
    'component-has-state-handling': {
      meta: {
        type: 'suggestion',
        docs: {
          description:
            'Components with async operations should handle loading and error states',
          category: 'Best Practices',
        },
        fixable: null,
        schema: [],
      },
      create(context) {
        const filename = context.getFilename();
        const isComponentFile =
          filename.includes('/components/') && filename.endsWith('.tsx');

        if (!isComponentFile) {
          return {};
        }

        return {
          FunctionDeclaration(node) {
            // Check if component uses async operations (useQuery, useEffect with async, etc.)
            // This is a simplified check - could be enhanced
            const hasAsyncOperations = context
              .getSourceCode()
              .getText(node)
              .includes('useQuery') ||
              context.getSourceCode().getText(node).includes('fetch(') ||
              context.getSourceCode().getText(node).includes('axios.');

            if (hasAsyncOperations) {
              const sourceCode = context.getSourceCode().getText(node);
              const hasLoadingState =
                sourceCode.includes('isLoading') ||
                sourceCode.includes('loading') ||
                sourceCode.includes('isPending');
              const hasErrorState =
                sourceCode.includes('error') ||
                sourceCode.includes('Error') ||
                sourceCode.includes('catch');

              if (!hasLoadingState || !hasErrorState) {
                context.report({
                  node,
                  message:
                    'Components with async operations should handle loading and error states',
                });
              }
            }
          },
        };
      },
    },
  },
};
