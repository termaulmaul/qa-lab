pipeline {
  agent any

  options {
    timeout(time: 15, unit: 'MINUTES')
  }

  environment {
    REPORT_DIR = 'reports'
    HOST_REPO_PATH = '/Users/maul/github/qa-lab'
  }

  parameters {
    string(name: 'TARGET_URL', defaultValue: 'http://app:8000', description: 'Base URL target app')
    string(name: 'ITERATION_SLEEP', defaultValue: '1', description: 'Sleep per iteration')
    string(name: 'LOGIN_USERNAME', defaultValue: 'qa_user', description: 'Login username')
    password(name: 'LOGIN_PASSWORD', defaultValue: 'qa_pass', description: 'Login password')
    string(name: 'SYMBOL', defaultValue: 'BBCA', description: 'Trading symbol')
    string(name: 'ORDER_QUANTITY', defaultValue: '1', description: 'Order quantity')
    string(name: 'NEGATIVE_ORDER_QUANTITY', defaultValue: '9999999', description: 'Negative UI quantity for insufficient buying power check')
    string(name: 'INFLUX_URL', defaultValue: 'http://influxdb:8086/k6', description: 'InfluxDB output URL')
    string(name: 'INFLUX_WRITE_URL', defaultValue: 'http://influxdb:8086/write?db=k6', description: 'InfluxDB write endpoint for Jenkins build trend metrics')
    booleanParam(name: 'RUN_REGRESSION_LOOP', defaultValue: false, description: 'Run repeated regression loop stage after stress test')
    string(name: 'REGRESSION_ITERATIONS', defaultValue: '2', description: 'Regression loop iteration count')
    string(name: 'REGRESSION_INTERVAL_SECONDS', defaultValue: '5', description: 'Delay between regression iterations in seconds')
    booleanParam(name: 'REGRESSION_STOP_ON_FAILURE', defaultValue: true, description: 'Stop regression loop immediately on failure')
    booleanParam(name: 'REGRESSION_RUN_API', defaultValue: true, description: 'Include API regression in loop')
    booleanParam(name: 'REGRESSION_RUN_UI', defaultValue: true, description: 'Include UI smoke in loop')
    booleanParam(name: 'REGRESSION_RUN_PERF', defaultValue: true, description: 'Include k6 regression in loop')
    string(name: 'REGRESSION_PERF_PROFILE', defaultValue: 'smoke', description: 'k6 profile for regression loop')
    string(name: 'REGRESSION_PERF_DURATION', defaultValue: '10s', description: 'k6 duration for regression loop')
    string(name: 'SMOKE_DURATION', defaultValue: '15s', description: 'Smoke test duration')
    string(name: 'LOAD_DURATION', defaultValue: '30s', description: 'Load test duration')
    string(name: 'LOAD_MARKET_RATE', defaultValue: '30', description: 'Load market rate per second')
    string(name: 'LOAD_PORTFOLIO_RATE', defaultValue: '10', description: 'Load portfolio rate per second')
    string(name: 'LOAD_TRADE_RATE', defaultValue: '4', description: 'Load trade rate per second')
    string(name: 'LOAD_NEGATIVE_RATE', defaultValue: '1', description: 'Load negative rate per second')
    string(name: 'STRESS_MARKET_START_RATE', defaultValue: '20', description: 'Stress market start rate')
    string(name: 'STRESS_STAGE1', defaultValue: '40', description: 'Stress market stage 1')
    string(name: 'STRESS_STAGE2', defaultValue: '80', description: 'Stress market stage 2')
    string(name: 'STRESS_STAGE3', defaultValue: '120', description: 'Stress market stage 3')
    string(name: 'STRESS_TRADE_START_RATE', defaultValue: '2', description: 'Stress trade start rate')
    string(name: 'STRESS_TRADE_STAGE1', defaultValue: '5', description: 'Stress trade stage 1')
    string(name: 'STRESS_TRADE_STAGE2', defaultValue: '10', description: 'Stress trade stage 2')
    string(name: 'STRESS_TRADE_STAGE3', defaultValue: '20', description: 'Stress trade stage 3')
    string(name: 'STRESS_NEGATIVE_START_RATE', defaultValue: '1', description: 'Stress negative start rate')
    string(name: 'STRESS_NEGATIVE_STAGE1', defaultValue: '2', description: 'Stress negative stage 1')
    string(name: 'STRESS_NEGATIVE_STAGE2', defaultValue: '4', description: 'Stress negative stage 2')
    string(name: 'STRESS_NEGATIVE_STAGE3', defaultValue: '8', description: 'Stress negative stage 3')
  }

  stages {
    stage('Smoke Check') {
      steps {
        sh 'mkdir -p reports/newman'
        sh 'mkdir -p output/playwright/smoke output/playwright/negative'
        sh 'docker version'
        sh 'docker ps --format "{{.Names}}" | grep -x qa-app-lab'
        sh 'docker ps --format "{{.Names}}" | grep -x influxdb-lab'
        sh 'docker ps --format "{{.Names}}" | grep -x grafana-lab'
      }
    }

    stage('Functional API') {
      steps {
        sh '''
          chmod +x /workspace/qa-lab/scripts/run_api_functional.sh
          rm -rf /workspace/qa-lab/reports/jenkins-newman
          mkdir -p /workspace/qa-lab/reports/jenkins-newman
          BASE_URL="$TARGET_URL" \
          LOGIN_USERNAME="$LOGIN_USERNAME" \
          LOGIN_PASSWORD="$LOGIN_PASSWORD" \
          SYMBOL="$SYMBOL" \
          REPORT_DIR="$HOST_REPO_PATH/reports/jenkins-newman" \
          HOST_REPO_PATH="$HOST_REPO_PATH" \
          /workspace/qa-lab/scripts/run_api_functional.sh
          cp -R /workspace/qa-lab/reports/jenkins-newman/. "$WORKSPACE/reports/newman/"
        '''
      }
    }

    stage('UI Automation') {
      steps {
        sh '''
          chmod +x /workspace/qa-lab/scripts/run_ui_smoke.sh /workspace/qa-lab/scripts/run_ui_negative.sh
          UI_BASE_URL="$TARGET_URL" \
          LOGIN_USERNAME="$LOGIN_USERNAME" \
          LOGIN_PASSWORD="$LOGIN_PASSWORD" \
          SYMBOL="$SYMBOL" \
          ORDER_QUANTITY="$ORDER_QUANTITY" \
          PLAYWRIGHT_OUTPUT_DIR="$HOST_REPO_PATH/output/playwright" \
          HOST_REPO_PATH="$HOST_REPO_PATH" \
          /workspace/qa-lab/scripts/run_ui_smoke.sh
          UI_BASE_URL="$TARGET_URL" \
          LOGIN_USERNAME="$LOGIN_USERNAME" \
          LOGIN_PASSWORD="$LOGIN_PASSWORD" \
          NEGATIVE_ORDER_QUANTITY="$NEGATIVE_ORDER_QUANTITY" \
          PLAYWRIGHT_OUTPUT_DIR="$HOST_REPO_PATH/output/playwright" \
          HOST_REPO_PATH="$HOST_REPO_PATH" \
          /workspace/qa-lab/scripts/run_ui_negative.sh
          mkdir -p "$WORKSPACE/output/playwright"
          cp -R /workspace/qa-lab/output/playwright/. "$WORKSPACE/output/playwright/"
        '''
      }
    }

    stage('Smoke') {
      steps {
        sh '''
          set -o pipefail
          docker run --rm \
            --network qa-lab-net \
            -v "$HOST_REPO_PATH/k6:/scripts:ro" \
            -e TARGET_URL="$TARGET_URL" \
            -e TEST_PROFILE="smoke" \
            -e TEST_DURATION="$SMOKE_DURATION" \
            -e ITERATION_SLEEP="$ITERATION_SLEEP" \
            -e LOGIN_USERNAME="$LOGIN_USERNAME" \
            -e LOGIN_PASSWORD="$LOGIN_PASSWORD" \
            -e SYMBOL="$SYMBOL" \
            -e ORDER_QUANTITY="$ORDER_QUANTITY" \
            -e K6_INFLUXDB_PUSH_INTERVAL="5s" \
            -e K6_INFLUXDB_CONCURRENT_WRITES="4" \
            grafana/k6:latest run \
            --out influxdb="$INFLUX_URL" \
            /scripts/script.js | tee "$WORKSPACE/reports/k6-smoke.log"
        '''
      }
    }

    stage('Load') {
      steps {
        sh '''
          set -o pipefail
          docker run --rm \
            --network qa-lab-net \
            -v "$HOST_REPO_PATH/k6:/scripts:ro" \
            -e TARGET_URL="$TARGET_URL" \
            -e TEST_PROFILE="load" \
            -e TEST_DURATION="$LOAD_DURATION" \
            -e ITERATION_SLEEP="$ITERATION_SLEEP" \
            -e LOGIN_USERNAME="$LOGIN_USERNAME" \
            -e LOGIN_PASSWORD="$LOGIN_PASSWORD" \
            -e SYMBOL="$SYMBOL" \
            -e ORDER_QUANTITY="$ORDER_QUANTITY" \
            -e MARKET_RATE="$LOAD_MARKET_RATE" \
            -e PORTFOLIO_RATE="$LOAD_PORTFOLIO_RATE" \
            -e TRADE_RATE="$LOAD_TRADE_RATE" \
            -e NEGATIVE_RATE="$LOAD_NEGATIVE_RATE" \
            -e K6_INFLUXDB_PUSH_INTERVAL="5s" \
            -e K6_INFLUXDB_CONCURRENT_WRITES="4" \
            grafana/k6:latest run \
            --out influxdb="$INFLUX_URL" \
            /scripts/script.js | tee "$WORKSPACE/reports/k6-load.log"
        '''
      }
    }

    stage('Stress') {
      steps {
        sh '''
          set -o pipefail
          docker run --rm \
            --network qa-lab-net \
            -v "$HOST_REPO_PATH/k6:/scripts:ro" \
            -e TARGET_URL="$TARGET_URL" \
            -e TEST_PROFILE="stress" \
            -e ITERATION_SLEEP="$ITERATION_SLEEP" \
            -e LOGIN_USERNAME="performance_user" \
            -e LOGIN_PASSWORD="secret123" \
            -e SYMBOL="$SYMBOL" \
            -e ORDER_QUANTITY="5" \
            -e MARKET_START_RATE="$STRESS_MARKET_START_RATE" \
            -e STRESS_STAGE1="$STRESS_STAGE1" \
            -e STRESS_STAGE2="$STRESS_STAGE2" \
            -e STRESS_STAGE3="$STRESS_STAGE3" \
            -e TRADE_START_RATE="$STRESS_TRADE_START_RATE" \
            -e TRADE_STAGE1="$STRESS_TRADE_STAGE1" \
            -e TRADE_STAGE2="$STRESS_TRADE_STAGE2" \
            -e TRADE_STAGE3="$STRESS_TRADE_STAGE3" \
            -e NEGATIVE_START_RATE="$STRESS_NEGATIVE_START_RATE" \
            -e NEGATIVE_STAGE1="$STRESS_NEGATIVE_STAGE1" \
            -e NEGATIVE_STAGE2="$STRESS_NEGATIVE_STAGE2" \
            -e NEGATIVE_STAGE3="$STRESS_NEGATIVE_STAGE3" \
            -e K6_INFLUXDB_PUSH_INTERVAL="5s" \
            -e K6_INFLUXDB_CONCURRENT_WRITES="4" \
            grafana/k6:latest run \
            --out influxdb="$INFLUX_URL" \
            /scripts/script.js | tee "$WORKSPACE/reports/k6-stress.log"
        '''
      }
    }

    stage('Regression Loop') {
      when {
        expression { return params.RUN_REGRESSION_LOOP }
      }
      steps {
        sh '''
          chmod +x /workspace/qa-lab/scripts/run_regression_automation.sh
          rm -rf "$WORKSPACE/reports/regression-loop"
          mkdir -p "$WORKSPACE/reports/regression-loop"
          TARGET_URL="$TARGET_URL" \
          ITERATION_SLEEP="$ITERATION_SLEEP" \
          LOGIN_USERNAME="$LOGIN_USERNAME" \
          LOGIN_PASSWORD="$LOGIN_PASSWORD" \
          SYMBOL="$SYMBOL" \
          ORDER_QUANTITY="$ORDER_QUANTITY" \
          INFLUX_URL="$INFLUX_URL" \
          HOST_REPO_PATH="$HOST_REPO_PATH" \
          RESULT_ROOT="$WORKSPACE/reports/regression-loop" \
          ITERATIONS="$REGRESSION_ITERATIONS" \
          INTERVAL_SECONDS="$REGRESSION_INTERVAL_SECONDS" \
          STOP_ON_FAILURE="$REGRESSION_STOP_ON_FAILURE" \
          RUN_API="$REGRESSION_RUN_API" \
          RUN_UI="$REGRESSION_RUN_UI" \
          RUN_PERF="$REGRESSION_RUN_PERF" \
          PERF_PROFILE="$REGRESSION_PERF_PROFILE" \
          PERF_DURATION="$REGRESSION_PERF_DURATION" \
          K6_INFLUXDB_PUSH_INTERVAL="5s" \
          K6_INFLUXDB_CONCURRENT_WRITES="4" \
          bash /workspace/qa-lab/scripts/run_regression_automation.sh
        '''
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'reports/**/*', fingerprint: false, allowEmptyArchive: true
      archiveArtifacts artifacts: 'output/playwright/**/*', fingerprint: false, allowEmptyArchive: true
      script {
        def resultCode = (currentBuild.currentResult == 'SUCCESS') ? 0 : 1
        sh """
          SMOKE_TRACE=0
          NEGATIVE_TRACE=0
          NEGATIVE_VIDEO=0
          WATCHLIST_NEGATIVE=0
          ORDERS_NEGATIVE=0

          [ -f "\$WORKSPACE/output/playwright/smoke/trace.zip" ] && SMOKE_TRACE=1
          [ -f "\$WORKSPACE/output/playwright/negative/trace.zip" ] && NEGATIVE_TRACE=1
          [ -f "\$WORKSPACE/output/playwright/negative/ui-negative.webm" ] && NEGATIVE_VIDEO=1
          [ -f "\$WORKSPACE/output/playwright/negative/watchlist-negative-ok.txt" ] && WATCHLIST_NEGATIVE=1
          [ -f "\$WORKSPACE/output/playwright/negative/orders-negative-ok.txt" ] && ORDERS_NEGATIVE=1

          TS_NS=\$(date +%s%N)
          JOB_TAG=\$(echo "\${JOB_NAME:-qa-lab}" | tr ' /' '__')
          BRANCH_TAG=\$(echo "\${BRANCH_NAME:-master}" | tr ' /' '__')

          curl -sS -XPOST "\$INFLUX_WRITE_URL" --data-binary \
            "jenkins_ui_build,job=\${JOB_TAG},branch=\${BRANCH_TAG} build_number=\${BUILD_NUMBER}i,result_code=${resultCode}i,ui_smoke_trace=\${SMOKE_TRACE}i,ui_negative_trace=\${NEGATIVE_TRACE}i,ui_negative_video=\${NEGATIVE_VIDEO}i,watchlist_negative=\${WATCHLIST_NEGATIVE}i,orders_negative=\${ORDERS_NEGATIVE}i \${TS_NS}" || true
        """

        def summary = []
        if (fileExists('reports/newman/functional-api.json')) {
          summary << 'functional:newman'
        }
        if (fileExists('output/playwright/smoke/ui-order-success.png')) {
          summary << 'ui:smoke'
        }
        if (fileExists('output/playwright/negative/ui-negative-result.png')) {
          summary << 'ui:negative'
        }
        if (fileExists('output/playwright/smoke/trace.zip') && fileExists('output/playwright/negative/trace.zip')) {
          summary << 'ui:trace'
        }
        if (fileExists('output/playwright/smoke/ui-smoke.webm') && fileExists('output/playwright/negative/ui-negative.webm')) {
          summary << 'ui:video'
        }
        if (fileExists('reports/k6-smoke.log')) {
          summary << 'perf:smoke'
        }
        if (fileExists('reports/k6-load.log')) {
          summary << 'perf:load'
        }
        if (fileExists('reports/k6-stress.log')) {
          summary << 'perf:stress'
        }
        if (fileExists('reports/regression-loop')) {
          summary << 'regression:loop'
        }
        currentBuild.description = summary.join(' | ')
      }
    }
  }
}
