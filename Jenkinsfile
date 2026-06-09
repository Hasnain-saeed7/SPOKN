pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Building Docker images...'
                sh 'docker-compose build'
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([
                    file(credentialsId: 'backend-env', variable: 'BACKEND_ENV'),
                    file(credentialsId: 'frontend-env', variable: 'FRONTEND_ENV')
                ]) {
                    sh 'cp $BACKEND_ENV backend/.env'
                    sh 'cp $FRONTEND_ENV frontend/.env'
                    sh 'docker-compose down || true'
                    sh 'docker-compose up -d'
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}