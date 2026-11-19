import { useMemo, useState } from 'react'
import './App.css'

type FlowBranch = {
  label: string
  detail: string
  tone: 'success' | 'error' | 'neutral'
  nodes: FlowNode[]
}

type FlowNode =
  | {
      kind: 'step' | 'condition-check'
      title: string
      detail: string
      source: string
    }
  | {
      kind: 'decision'
      title: string
      detail: string
      source: string
      branches: FlowBranch[]
    }
  | {
      kind: 'response'
      title: string
      detail: string
      source: string
      tone: 'success' | 'error'
    }

type BackendEndpoint = {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  summary: string
  flow: FlowNode[]
}

type BackendService = {
  id: string
  name: string
  description: string
  port: number
  basePath: string
  endpoints: BackendEndpoint[]
  accent: 'violet' | 'teal'
}

type EndpointCondition = {
  title: string
  detail: string
}

type EndpointOperation = {
  title: string
  detail: string
}

const userEndpoints: BackendEndpoint[] = [
  {
    id: 'users-create',
    method: 'POST',
    path: '',
    summary: 'Create user',
    flow: [
      {
        kind: 'decision',
        title: 'Does the request pass validation?',
        detail: 'Name must be 2–100 characters; email must be present and valid.',
        source: 'CreateUserRequest.java · @Valid',
        branches: [
          {
            label: 'NO',
            detail: 'Reject the request before any account is created.',
            tone: 'error',
            nodes: [
              {
                kind: 'response',
                title: 'Details need correction',
                detail: 'Explain which account details need correction.',
                source: 'UserRestExceptionHandler.java',
                tone: 'error',
              },
            ],
          },
          {
            label: 'YES',
            detail: 'Continue with the supplied account details.',
            tone: 'success',
            nodes: [
              {
                kind: 'step',
                title: 'Read the new account details',
                detail: 'Use the supplied name, email, and role.',
                source: 'UserController.java → UserRestMapper.java',
              },
              {
                kind: 'condition-check',
                title: 'Check whether this email is already in use',
                detail: 'Ignore surrounding spaces and letter case.',
                source: 'UserService.java',
              },
              {
                kind: 'decision',
                title: 'Is the email already registered?',
                detail: 'The duplicate check uses the normalized email.',
                source: 'UserRepositoryAdapter.java',
                branches: [
                  {
                    label: 'YES',
                    detail: 'An account already uses this email.',
                    tone: 'error',
                    nodes: [
                      {
                        kind: 'response',
                        title: 'Email already in use',
                        detail: 'Tell the user that this email is already in use.',
                        source: 'UserRestExceptionHandler.java',
                        tone: 'error',
                      },
                    ],
                  },
                  {
                    label: 'NO',
                    detail: 'Create the account.',
                    tone: 'success',
                    nodes: [
                      {
                        kind: 'decision',
                        title: 'Are the name and email acceptable?',
                        detail: 'Double-check the required name and email rules.',
                        source: 'User.java',
                        branches: [
                          {
                            label: 'NO',
                            detail: 'The name or email does not meet the account rules.',
                            tone: 'error',
                            nodes: [
                              {
                                kind: 'response',
                                title: 'Details need correction',
                                detail: 'Explain which account details need correction.',
                                source: 'UserRestExceptionHandler.java',
                                tone: 'error',
                              },
                            ],
                          },
                          {
                            label: 'YES',
                            detail: 'If no role is given, use Customer; new accounts start as Active.',
                            tone: 'success',
                            nodes: [
                              {
                                kind: 'step',
                                title: 'Save the new account',
                                detail: 'Store it and assign its new ID.',
                                source: 'UserRepositoryAdapter.java',
                              },
                              {
                                kind: 'step',
                                title: 'Prepare the new account details',
                                detail: 'Include its ID and created and updated dates.',
                                source: 'UserRestMapper.java',
                              },
                              {
                                kind: 'response',
                                title: 'Account created',
                                detail: 'Show the new account and where to find it.',
                                source: 'UserController.java',
                                tone: 'success',
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'users-list',
    method: 'GET',
    path: '',
    summary: 'List users',
    flow: [
      {
        kind: 'step',
        title: 'Receive the request to list users',
        detail: 'No request body or ID is required.',
        source: 'UserController.java',
      },
      {
        kind: 'step',
        title: 'Load all user accounts',
        detail: 'Gather the users currently stored.',
        source: 'UserService.java → UserRepositoryAdapter.java',
      },
      {
        kind: 'step',
        title: 'Prepare the user list',
        detail: 'Include each account’s role, status, and dates.',
        source: 'UserRestMapper.java',
      },
      {
        kind: 'decision',
        title: 'Are there users to show?',
        detail: 'Either way, the result is a user list that may be empty.',
        source: 'UserController.java',
        branches: [
          {
            label: 'NO',
            detail: 'Return an empty array.',
            tone: 'neutral',
            nodes: [
              {
                kind: 'response',
                title: 'No users yet',
                detail: 'There are no accounts to show.',
                source: 'UserController.java',
                tone: 'success',
              },
            ],
          },
          {
            label: 'YES',
            detail: 'Return the mapped user array.',
            tone: 'success',
            nodes: [
              {
                kind: 'response',
                title: 'Users returned',
                detail: 'Each item includes the account details and dates.',
                source: 'UserController.java',
                tone: 'success',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'users-get',
    method: 'GET',
    path: '/{id}',
    summary: 'Get user by ID',
    flow: [
      {
        kind: 'condition-check',
        title: 'Look up the requested user',
        detail: 'Check whether an account exists with this ID.',
        source: 'UserController.java → UserService.java',
      },
      {
        kind: 'decision',
        title: 'Does the user exist?',
        detail: 'The lookup either finds an account or returns no match.',
        source: 'UserRepositoryAdapter.java',
        branches: [
          {
            label: 'NO',
            detail: 'No account matches this ID.',
            tone: 'error',
            nodes: [
              {
                kind: 'response',
                title: 'User not found',
                detail: 'Tell the user that this account was not found.',
                source: 'UserRestExceptionHandler.java',
                tone: 'error',
              },
            ],
          },
          {
            label: 'YES',
            detail: 'Prepare the user details.',
            tone: 'success',
            nodes: [
              {
                kind: 'step',
                title: 'Show the account details',
                detail: 'Include the account’s role, status, and dates.',
                source: 'UserRestMapper.java',
              },
              {
                kind: 'response',
                title: 'User details ready',
                detail: 'Return the requested user.',
                source: 'UserController.java',
                tone: 'success',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'users-update',
    method: 'PUT',
    path: '/{id}',
    summary: 'Update user',
    flow: [
      {
        kind: 'decision',
        title: 'Does the request pass validation?',
        detail: 'Name and email are required; role and status can be left unchanged.',
        source: 'UpdateUserRequest.java · @Valid',
        branches: [
          {
            label: 'NO',
            detail: 'Reject the request before changing the account.',
            tone: 'error',
            nodes: [
              {
                kind: 'response',
                title: 'Details need correction',
                detail: 'Explain which account details need correction.',
                source: 'UserRestExceptionHandler.java',
                tone: 'error',
              },
            ],
          },
          {
            label: 'YES',
            detail: 'Read the ID and the new account details.',
            tone: 'success',
            nodes: [
              {
                kind: 'condition-check',
                title: 'Load the existing user',
                detail: 'Check the ID before making any changes.',
                source: 'UserController.java → UserService.java',
              },
              {
                kind: 'decision',
                title: 'Does the user exist?',
                detail: 'If no account is found, the update stops.',
                source: 'UserRepositoryAdapter.java',
                branches: [
                  {
                    label: 'NO',
                    detail: 'Stop the update.',
                    tone: 'error',
                    nodes: [
                      {
                        kind: 'response',
                        title: 'User not found',
                        detail: 'The user exception handler returns the not-found error.',
                        source: 'UserRestExceptionHandler.java',
                        tone: 'error',
                      },
                    ],
                  },
                  {
                    label: 'YES',
                    detail: 'Check whether another account already uses this email.',
                    tone: 'success',
                    nodes: [
                      {
                        kind: 'decision',
                        title: 'Is this email used by another account?',
                        detail: 'The current account can keep its own email.',
                        source: 'UserService.java',
                        branches: [
                          {
                            label: 'YES',
                            detail: 'Another account already uses this email.',
                            tone: 'error',
                            nodes: [
                              {
                                kind: 'response',
                                title: 'Email already in use',
                                detail: 'Tell the user to choose a different email.',
                                source: 'UserRestExceptionHandler.java',
                                tone: 'error',
                              },
                            ],
                          },
                          {
                            label: 'NO',
                            detail: 'Update the account name and email.',
                            tone: 'success',
                            nodes: [
                              {
                                kind: 'decision',
                                title: 'Are the name and email acceptable?',
                                detail: 'Check the name and email rules before saving.',
                                source: 'User.java',
                                branches: [
                                  {
                                    label: 'NO',
                                    detail: 'The name or email does not meet the account rules.',
                                    tone: 'error',
                                    nodes: [
                                      {
                                        kind: 'response',
                                        title: 'Details need correction',
                                        detail: 'Explain which account details need correction.',
                                        source: 'UserRestExceptionHandler.java',
                                        tone: 'error',
                                      },
                                    ],
                                  },
                                  {
                                    label: 'YES',
                                    detail: 'Apply a new status if one was provided.',
                                    tone: 'success',
                                    nodes: [
                                      {
                                        kind: 'decision',
                                        title: 'Was a new status provided?',
                                        detail: 'If not, keep the current status.',
                                        source: 'UserService.java',
                                        branches: [
                                          {
                                            label: 'NO',
                                            detail: 'Keep the current status.',
                                            tone: 'neutral',
                                            nodes: [
                                              {
                                                kind: 'step',
                                                title: 'Save the account changes',
                                                detail: 'Store the updated details.',
                                                source: 'UserRepositoryAdapter.java → UserRestMapper.java',
                                              },
                                              {
                                                kind: 'response',
                                                title: 'User updated',
                                                detail: 'Return the updated user.',
                                                source: 'UserController.java',
                                                tone: 'success',
                                              },
                                            ],
                                          },
                                          {
                                            label: 'YES',
                                            detail: 'Use the selected status.',
                                            tone: 'success',
                                            nodes: [
                                              {
                                                kind: 'step',
                                                title: 'Save the account changes',
                                                detail: 'Store the updated details and status.',
                                                source: 'UserRepositoryAdapter.java → UserRestMapper.java',
                                              },
                                              {
                                                kind: 'response',
                                                title: 'User updated',
                                                detail: 'Return the updated user.',
                                                source: 'UserController.java',
                                                tone: 'success',
                                              },
                                            ],
                                          },
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'users-delete',
    method: 'DELETE',
    path: '/{id}',
    summary: 'Delete user',
    flow: [
      {
        kind: 'condition-check',
        title: 'Check whether the ID exists',
        detail: 'Look for the account before deleting it.',
        source: 'UserService.java → UserRepositoryAdapter.java',
      },
      {
        kind: 'decision',
        title: 'Does the user exist?',
        detail: 'Delete only when an account with this ID is found.',
        source: 'UserService.java',
        branches: [
          {
            label: 'NO',
            detail: 'No account matches this ID.',
            tone: 'error',
            nodes: [
              {
                kind: 'response',
                title: 'User not found',
                detail: 'Tell the user that this account was not found.',
                source: 'UserRestExceptionHandler.java',
                tone: 'error',
              },
            ],
          },
          {
            label: 'YES',
            detail: 'Remove the account.',
            tone: 'success',
            nodes: [
              {
                kind: 'step',
                title: 'Delete the user account',
                detail: 'Remove the matching account from storage.',
                source: 'UserRepositoryAdapter.java',
              },
              {
                kind: 'response',
                title: 'User deleted',
                detail: 'The account has been removed.',
                source: 'UserController.java',
                tone: 'success',
              },
            ],
          },
        ],
      },
    ],
  },
]

const productEndpoints: BackendEndpoint[] = [
  {
    id: 'products-create',
    method: 'POST',
    path: '',
    summary: 'Create product',
    flow: [
      {
        kind: 'decision',
        title: 'Does the request pass validation?',
        detail: 'Name 2–150 characters, description up to 1000; price and stock cannot be negative.',
        source: 'CreateProductRequest.java · @Valid',
        branches: [
          {
            label: 'NO',
            detail: 'Reject the request before creating a product.',
            tone: 'error',
            nodes: [
              {
                kind: 'response',
                title: 'Details need correction',
                detail: 'Explain which product details need correction.',
                source: 'ProductController.java',
                tone: 'error',
              },
            ],
          },
          {
            label: 'YES',
            detail: 'Create and save the product.',
            tone: 'success',
            nodes: [
              {
                kind: 'step',
                title: 'Save the product details',
                detail: 'Store its name, description, price, and stock.',
                source: 'ProductController.java → ProductService.java',
              },
              {
                kind: 'step',
                title: 'Record when the product was created',
                detail: 'The created and updated dates are set automatically.',
                source: 'ProductEntity.java',
              },
              {
                kind: 'step',
                title: 'Prepare the product details and its new address',
                detail: 'Use the new product ID in its address.',
                source: 'ProductResponse.java → ProductController.java',
              },
              {
                kind: 'response',
                title: 'Product created',
                detail: 'Show the new product and where to find it.',
                source: 'ProductController.java',
                tone: 'success',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'products-list',
    method: 'GET',
    path: '',
    summary: 'List products',
    flow: [
      {
        kind: 'step',
        title: 'Load all products',
        detail: 'Gather the products currently in the catalog.',
        source: 'ProductController.java → ProductService.java',
      },
      {
        kind: 'step',
        title: 'Prepare the product list',
        detail: 'Gather the details for each product.',
        source: 'ProductResponse.java',
      },
      {
        kind: 'decision',
        title: 'Are there products to show?',
        detail: 'Either way, the result is a product list that may be empty.',
        source: 'ProductController.java',
        branches: [
          {
            label: 'NO',
            detail: 'Return an empty array.',
            tone: 'neutral',
            nodes: [
              {
                kind: 'response',
                title: 'No products yet',
                detail: 'The catalog has no products yet.',
                source: 'ProductController.java',
                tone: 'success',
              },
            ],
          },
          {
            label: 'YES',
            detail: 'Return the product details.',
            tone: 'success',
            nodes: [
              {
                kind: 'response',
                title: 'Products returned',
                detail: 'Each item includes price, stock, and dates.',
                source: 'ProductController.java',
                tone: 'success',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'products-get',
    method: 'GET',
    path: '/{id}',
    summary: 'Get product by ID',
    flow: [
      {
        kind: 'condition-check',
        title: 'Look up the product by ID',
        detail: 'Search for a matching product.',
        source: 'ProductController.java → ProductService.java',
      },
      {
        kind: 'decision',
        title: 'Does the product exist?',
        detail: 'If no product matches, return a not-found response.',
        source: 'ProductService.java',
        branches: [
          {
            label: 'NO',
            detail: 'No product matches this ID.',
            tone: 'error',
            nodes: [
              {
                kind: 'response',
                title: 'Product not found',
                detail: 'Tell the user that this product was not found.',
                source: 'ProductService.java',
                tone: 'error',
              },
            ],
          },
          {
            label: 'YES',
            detail: 'Prepare the product details.',
            tone: 'success',
            nodes: [
              {
                kind: 'response',
                title: 'Product details ready',
                detail: 'Return the requested product.',
                source: 'ProductResponse.java → ProductController.java',
                tone: 'success',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'products-update',
    method: 'PUT',
    path: '/{id}',
    summary: 'Update product',
    flow: [
      {
        kind: 'decision',
        title: 'Does the request pass validation?',
        detail: 'The same name, description, price, and stock rules apply.',
        source: 'UpdateProductRequest.java · @Valid',
        branches: [
          {
            label: 'NO',
            detail: 'Reject the request before changing a product.',
            tone: 'error',
            nodes: [
              {
                kind: 'response',
                title: 'Details need correction',
                detail: 'Explain which product details need correction.',
                source: 'ProductController.java',
                tone: 'error',
              },
            ],
          },
          {
            label: 'YES',
            detail: 'Find the product before changing it.',
            tone: 'success',
            nodes: [
              {
                kind: 'decision',
                title: 'Does the product exist?',
                detail: 'A product must be found before it can be changed.',
                source: 'ProductService.java',
                branches: [
                  {
                    label: 'NO',
                    detail: 'No product matches this ID.',
                    tone: 'error',
                    nodes: [
                      {
                        kind: 'response',
                        title: 'Product not found',
                        detail: 'Tell the user that this product was not found.',
                        source: 'ProductService.java',
                        tone: 'error',
                      },
                    ],
                  },
                  {
                    label: 'YES',
                    detail: 'Set name, description, price, and stock.',
                    tone: 'success',
                    nodes: [
                      {
                        kind: 'step',
                        title: 'Save the product changes',
                        detail: 'Save the changes and refresh the updated date.',
                        source: 'ProductService.java → ProductEntity.java',
                      },
                      {
                        kind: 'response',
                        title: 'Product updated',
                        detail: 'Return the updated product details.',
                        source: 'ProductResponse.java → ProductController.java',
                        tone: 'success',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'products-delete',
    method: 'DELETE',
    path: '/{id}',
    summary: 'Delete product',
    flow: [
      {
        kind: 'decision',
        title: 'Does the product exist?',
        detail: 'Find the product before deleting it.',
        source: 'ProductService.java',
        branches: [
          {
            label: 'NO',
            detail: 'No product matches this ID.',
            tone: 'error',
            nodes: [
              {
                kind: 'response',
                title: 'Product not found',
                detail: 'Tell the user that this product was not found.',
                source: 'ProductService.java',
                tone: 'error',
              },
            ],
          },
          {
            label: 'YES',
            detail: 'Remove the product.',
            tone: 'success',
            nodes: [
              {
                kind: 'step',
                title: 'Delete the product',
                detail: 'Remove the matching product from storage.',
                source: 'ProductService.java',
              },
              {
                kind: 'response',
                title: 'Product deleted',
                detail: 'The product has been removed.',
                source: 'ProductController.java',
                tone: 'success',
              },
            ],
          },
        ],
      },
    ],
  },
]

const services: BackendService[] = [
  {
    id: 'users',
    name: 'User service',
    description: 'Handles user accounts, roles, and account status.',
    port: 8081,
    basePath: '/api/v1/users',
    accent: 'violet',
    endpoints: userEndpoints,
  },
  {
    id: 'products',
    name: 'Products',
    description: 'Keeps track of products, prices, descriptions, and stock.',
    port: 8082,
    basePath: '/api/v1/products',
    accent: 'teal',
    endpoints: productEndpoints,
  },
]

function flowSearchTerms(nodes: FlowNode[]): string[] {
  return nodes.flatMap((node) => {
    const terms = [node.title, node.detail]
    return node.kind === 'decision'
      ? [...terms, ...node.branches.flatMap((branch) => [branch.label, branch.detail, ...flowSearchTerms(branch.nodes)])]
      : terms
  })
}

function getVisibleEndpoints(service: BackendService, query: string): BackendEndpoint[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery || `${service.name} ${service.description}`.toLowerCase().includes(normalizedQuery)) {
    return service.endpoints
  }

  return service.endpoints.filter((endpoint) =>
    [
      endpoint.method,
      service.basePath + endpoint.path,
      endpoint.summary,
      ...flowSearchTerms(endpoint.flow),
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery),
  )
}

function summarizeEndpoint(nodes: FlowNode[]) {
  const conditions: EndpointCondition[] = []
  const operations: EndpointOperation[] = []

  const addOperation = (operation: EndpointOperation) => {
    if (!operations.some((item) => item.title === operation.title && item.detail === operation.detail)) {
      operations.push(operation)
    }
  }

  const collect = (flowNodes: FlowNode[]) => {
    flowNodes.forEach((node) => {
      if (node.kind === 'decision') {
        conditions.push({
          title: node.title,
          detail: node.detail,
        })
        node.branches.forEach((branch) => collect(branch.nodes))
        return
      }

      if (node.kind === 'step') {
        addOperation({ title: node.title, detail: node.detail })
      }
    })
  }

  collect(nodes)
  return { conditions, operations }
}

function EndpointFlowWorkspace({
  service,
  endpoint,
  onBack,
}: {
  service: BackendService
  endpoint: BackendEndpoint
  onBack: () => void
}) {
  const summary = summarizeEndpoint(endpoint.flow)

  return (
    <main className="flow-workspace">
      <header className="flow-workspace-header">
        <button type="button" className="workspace-back" onClick={onBack}>
          <span aria-hidden="true">←</span> All endpoints
        </button>
        <span className="workspace-service">{service.name}</span>
      </header>

      <section className="flow-workspace-content">
        <div className="flow-workspace-heading">
          <div className="workspace-endpoint-title">
            <span className={`method method--${endpoint.method.toLowerCase()}`}>{endpoint.method}</span>
            <div>
              <p className="flow-kicker">ENDPOINT SUMMARY</p>
              <h1>{endpoint.summary}</h1>
              <code>{service.basePath}{endpoint.path}</code>
            </div>
          </div>
        </div>

        <div className="endpoint-summary">
          <section className="summary-column" aria-labelledby="conditions-heading">
            <header className="summary-column-heading">
              <div>
                <p>RULES AND VALIDATION</p>
                <h2 id="conditions-heading">Conditions</h2>
              </div>
              <span className="summary-count">{summary.conditions.length}</span>
            </header>
            {summary.conditions.length ? (
              <ol className="condition-list">
                {summary.conditions.map((condition, index) => (
                  <li className="condition-card" key={`${condition.title}-${index}`}>
                    <h3>{condition.title}</h3>
                    <p className="summary-card-detail">{condition.detail}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="summary-empty">No explicit conditions are listed for this endpoint.</p>
            )}
          </section>

          <section className="summary-column" aria-labelledby="operations-heading">
            <header className="summary-column-heading">
              <div>
                <p>ENDPOINT BEHAVIOR</p>
                <h2 id="operations-heading">Operations</h2>
              </div>
              <span className="summary-count">{summary.operations.length}</span>
            </header>
            {summary.operations.length ? (
              <ol className="operation-list">
                {summary.operations.map((operation, index) => (
                  <li className="operation-card" key={`${operation.title}-${index}`}>
                    <div>
                      <span className="operation-type">Operation</span>
                      <h3>{operation.title}</h3>
                      {operation.detail && <p className="summary-card-detail">{operation.detail}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="summary-empty">No operations are listed for this endpoint.</p>
            )}
          </section>
        </div>
      </section>
    </main>
  )
}

function App() {
  const [query, setQuery] = useState('')
  const [activeEndpointId, setActiveEndpointId] = useState<string | null>(null)
  const visibleServices = useMemo(() => {
    return services.filter((service) => getVisibleEndpoints(service, query).length > 0)
  }, [query])
  const activeService = services.find((service) => service.endpoints.some((endpoint) => endpoint.id === activeEndpointId))
  const activeEndpoint = activeService?.endpoints.find((endpoint) => endpoint.id === activeEndpointId)

  if (activeService && activeEndpoint) {
    return (
      <EndpointFlowWorkspace
        service={activeService}
        endpoint={activeEndpoint}
        onBack={() => setActiveEndpointId(null)}
      />
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#services" aria-label="Backend Atlas home">
          <span className="brand-mark" aria-hidden="true">B</span>
          <span className="brand-copy">
            <strong>Backend Atlas</strong>
            <span>Backend endpoint explorer</span>
          </span>
        </a>
        <span className="endpoint-total">10 endpoints</span>
      </header>

      <main className="page-content" id="services">
        <section className="services-section">
          <div className="section-heading">
            <div>
              <h1>Backend endpoints</h1>
              <p className="section-description">Select an endpoint to see how it works.</p>
            </div>
            <label className="search-box">
              <span className="search-icon" aria-hidden="true">⌕</span>
              <span className="sr-only">Search endpoints</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find an endpoint..."
              />
            </label>
          </div>

          <div className="service-list">
            {visibleServices.map((service) => (
              <article className={`service-card service-card--${service.accent}`} key={service.id}>
                <div className="service-heading">
                  <div>
                    <h2>{service.name}</h2>
                    <p>{service.description}</p>
                  </div>
                  <span className="service-port">{service.port}</span>
                </div>

                <div className="route-list">
                  {getVisibleEndpoints(service, query).map((endpoint) => (
                    <button
                      type="button"
                      className="route-row"
                      key={endpoint.id}
                      onClick={() => setActiveEndpointId(endpoint.id)}
                    >
                      <span className={`method method--${endpoint.method.toLowerCase()}`}>{endpoint.method}</span>
                      <code>{service.basePath}{endpoint.path}</code>
                      <span className="route-summary">{endpoint.summary}</span>
                      <span className="route-toggle" aria-hidden="true">→</span>
                    </button>
                  ))}
                </div>
              </article>
            ))}
            {visibleServices.length === 0 && (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">⌕</span>
                <h3>No matching endpoints</h3>
                <p>Try a service name, method, or endpoint path.</p>
                <button type="button" onClick={() => setQuery('')}>Clear search</button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
