# Deprecated Helm Configuration Files

The following files are no longer used as we have migrated to operator-based deployments:

## Keycloak Helm Configuration (DEPRECATED)
- `keycloak_options.yaml` - Previously used for Helm chart configuration
- `keycloak_ingress_http.yaml` - Previously used for HTTP ingress setup  
- `keycloak_config.json` - Previously used for realm configuration via ConfigMap

## New Operator-Based Configuration
These files are now used instead:
- `keycloak-instance.yaml` - Keycloak operator custom resource
- `keycloak-realm-import.yaml` - KeycloakRealmImport custom resource
- `keycloak-ingress-operators.yaml` - Ingress for operator-managed Keycloak
- `postgresql-cluster.yaml` - CloudNativePG PostgreSQL cluster

## Migration Benefits
- **No Bitnami Dependencies**: Uses official PostgreSQL images via CloudNativePG operator
- **Better Management**: Kubernetes-native operators handle lifecycle management
- **Improved Security**: Operators provide better security posture and updates
- **Scalability**: Easier scaling and high availability configuration
- **Maintenance**: Automated backups, upgrades, and monitoring via operators
