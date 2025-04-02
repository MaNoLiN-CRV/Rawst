/// Configuration for an API entity.
pub struct Entity {
    /// Name of the entity.
    pub name: String,
    /// Optional table name in the database.
    pub table_name: Option<String>,
    /// List of fields in the entity.
    pub fields: Vec<Field>,
    /// Relationships with other entities.
    pub relationships: Vec<Relationship>,
    /// Configuration for endpoints related to the entity.
    pub endpoints: EndpointConfig,
    /// Whether authentication is required for this entity.
    pub authentication: bool,
    /// Authorization configuration for the entity.
    pub authorization: Authorization,
    /// List of validations for the entity.
    pub validations: Vec<Validation>,
    /// Pagination configuration (optional).
    pub pagination: Option<PaginationConfig>,
}

/// Configuration for a field in an entity.
pub struct Field {
    /// Name of the field.
    pub name: String,
    /// Optional column name in the database.
    pub column_name: Option<String>,
    /// Data type of the field.
    pub data_type: DataType,
    /// Whether the field is required.
    pub required: bool,
    /// Whether the field must be unique.
    pub unique: bool,
    /// Whether the field is searchable.
    pub searchable: bool,
    /// Default value for the field (optional).
    pub default_value: Option<String>,
    /// Description of the field (optional).
    pub description: Option<String>,
}

/// Supported data types for fields.
pub enum DataType {
    /// String data type.
    String,
    /// Integer data type.
    Integer,
    /// Float data type.
    Float,
    /// Boolean data type.
    Boolean,
    /// Date data type.
    Date,
    /// DateTime data type.
    DateTime,
    /// Binary data type.
    Binary,
    /// JSON data type.
    JSON,
}

/// Configuration for a relationship between entities.
pub struct Relationship {
    /// Name of the relationship.
    pub name: String,
    /// Name of the related entity.
    pub related_entity: String,
    /// Type of the relationship.
    pub type_: RelationshipType,
    /// Foreign key for the relationship.
    pub foreign_key: String,
    /// Whether to include the relationship in responses.
    pub include_in_responses: bool,
}

/// Supported types of relationships.
pub enum RelationshipType {
    /// One-to-one relationship.
    OneToOne,
    /// One-to-many relationship.
    OneToMany,
    /// Many-to-one relationship.
    ManyToOne,
    /// Many-to-many relationship.
    ManyToMany,
}

/// Configuration for endpoints related to an entity.
pub struct EndpointConfig {
    /// Whether to generate a create endpoint.
    pub generate_create: bool,
    /// Whether to generate a read endpoint.
    pub generate_read: bool,
    /// Whether to generate an update endpoint.
    pub generate_update: bool,
    /// Whether to generate a delete endpoint.
    pub generate_delete: bool,
    /// Whether to generate a list endpoint.
    pub generate_list: bool,
    /// List of custom routes for the entity.
    pub custom_routes: Vec<CustomRoute>,
}

/// Configuration for a custom route.
pub struct CustomRoute {
    /// Path of the custom route.
    pub path: String,
    /// HTTP method for the custom route.
    pub method: HttpMethod,
    /// Handler for the custom route.
    pub handler: String,
}

/// Supported HTTP methods.
pub enum HttpMethod {
    /// HTTP GET method.
    GET,
    /// HTTP POST method.
    POST,
    /// HTTP PUT method.
    PUT,
    /// HTTP PATCH method.
    PATCH,
    /// HTTP DELETE method.
    DELETE,
}

/// Configuration for authorization related to an entity.
pub struct Authorization {
    /// Whether authorization is active.
    pub active: bool,
    /// List of roles for authorization.
    pub roles: Vec<Role>,
    /// List of permissions for authorization.
    pub permissions: Vec<Permission>,
}

/// Configuration for a role in authorization.
pub struct Role {
    /// Name of the role.
    pub name: String,
    /// Description of the role (optional).
    pub description: Option<String>,
}

/// Configuration for a permission in authorization.
pub struct Permission {
    /// Action for the permission.
    pub action: String,
    /// Subject for the permission.
    pub subject: String,
}

/// Configuration for a validation related to an entity.
pub struct Validation {
    /// Field to validate.
    pub field: String,
    /// Type of validation.
    pub validation_type: ValidationType,
    /// Error message for the validation (optional).
    pub error_message: Option<String>,
}

/// Supported types of validations.
pub enum ValidationType {
    /// Length validation with minimum and optional maximum.
    Length(u32, Option<u32>),
    /// Regex validation.
    Regex(String),
    /// Email validation.
    Email,
    /// Numeric validation.
    Numeric,
    /// Range validation with minimum and maximum.
    Range(f64, f64),
}

/// Configuration for pagination related to an entity.
pub struct PaginationConfig {
    /// Default page size for pagination.
    pub default_page_size: u32,
    /// Maximum page size for pagination.
    pub max_page_size: u32,
    /// Name of the page parameter.
    pub page_param_name: String,
    /// Name of the size parameter.
    pub size_param_name: String,
}
