manifests.yaml: charts
	helm template external-secrets-operator . --skip-crds --namespace external-secrets-operator | tee manifests.yaml

charts: Chart.yaml Chart.lock values.yaml
	helm dependency build
