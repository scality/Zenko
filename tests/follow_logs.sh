#!/bin/sh

echo "Starting to wait for Test container to be ready:"
echo "\tV=${V}"
echo "\tKUBECTL=${KUBECTL}"
echo "\tNAMESPACE=${NAMESPACE}"

getPhase() {
    #yaml=`${V}${KUBECTL} --namespace ${NAMESPACE} get pod ${E2E_POD} -o yaml`
    # echo "yaml:\n${yaml}"
    #phase_line=`echo ${yaml} | grep -i phase:`
    #echo "phase_line::\n\t${phase_line}"
    #phase=`echo ${phase_line} | awk '{ print $2 }'`
    #echo "phase::\n\t${phase}"
    ${V}${KUBECTL} --namespace ${NAMESPACE} get pod ${E2E_POD} -o yaml | grep -i phase: | awk '{ print $2 }'
}

${V}${KUBECTL} --namespace ${NAMESPACE} get pods
TEST_POD_PHASE=`getPhase`
while [ ! "${TEST_POD_PHASE}" ]; do
	echo "${E2E_POD} pod state is currently undefined. Sleeping 5 seconds before checking again"
	sleep 5
	TEST_POD_PHASE=`getPhase`
done
while [ "${TEST_POD_PHASE}" != "Failed" ] && [ "${TEST_POD_PHASE}" != "Unknown" ] && [ "${TEST_POD_PHASE}" != "Succeeded" ] ; do
	if [ "${TEST_POD_PHASE}" = "Pending" ]; then
		echo "${E2E_POD} pod state is 'Pending', sleeping 5 seconds before checking again"
		sleep 5
	elif [ ! "${TEST_POD_PHASE}" ]; then
		echo "${E2E_POD} pod state is currently undefined. Sleeping 5 seconds before checking again"
		sleep 5
	else
		${V}${KUBECTL} --namespace ${NAMESPACE} logs -f ${E2E_POD}
	fi
	TEST_POD_PHASE=`getPhase`
	echo "\tPhase is: ${TEST_POD_PHASE}"
done
echo "Test completed with pod phase: ${TEST_POD_PHASE}"
if [ ! "${TEST_POD_PHASE}" ] || [ "${TEST_POD_PHASE}" = "Failed" ] || [ "${TEST_POD_PHASE}" = "Unknown" ]; then
	echo "Tests have failed"
	kubectl get all
	exit 1
fi
