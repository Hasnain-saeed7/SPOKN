pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = '12809'
    }

    stages {
        stage('Build') {
            steps {
                echo 'Building Docker images...'
                sh 'docker-compose build'
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    sh 'docker tag spokn-backend:latest $DOCKER_USER/spokn-backend:latest'
                    sh 'docker tag spokn-frontend:latest $DOCKER_USER/spokn-frontend:latest'
                    sh 'docker push $DOCKER_USER/spokn-backend:latest'
                    sh 'docker push $DOCKER_USER/spokn-frontend:latest'
                }
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