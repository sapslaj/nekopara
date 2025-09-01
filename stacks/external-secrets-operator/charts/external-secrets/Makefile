manifests.yaml: charts
	helm template external-secrets-operator . --skip-crds | tee manifests.yaml

charts:
	helm dependency build
