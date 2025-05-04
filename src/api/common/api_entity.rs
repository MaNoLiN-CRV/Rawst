use serde::{Deserialize, Serialize};

// Alias trait
pub trait ApiEntity: Serialize + Send + Sync + 'static + for<'de> Deserialize<'de> {}

// Implement ApiEntity for any type that satisfies its super traits
impl<T> ApiEntity for T 
where 
    T: Serialize + Send + Sync + 'static + for<'de> Deserialize<'de>
{}