env_variables=$(yq eval '.env | to_entries | .[] | .key + "=" + .value' .github/workflows/end2end.yaml | sed 's/\${{[^}]*}}//g') && export $env_variables
