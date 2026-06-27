pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = '12809'
    }

    stages {

        stage('Build') {
            steps {
                echo 'Building Docker images...'
                sh 'docker compose build --no-cache'
            }
        }

        stage('Push to Docker Hub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                        docker tag spokn-backend:latest $DOCKER_USER/spokn-backend:latest
                        docker tag spokn-frontend:latest $DOCKER_USER/spokn-frontend:latest
                        docker push $DOCKER_USER/spokn-backend:latest
                        docker push $DOCKER_USER/spokn-frontend:latest
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([
                    file(credentialsId: 'backend-env', variable: 'BACKEND_ENV'),
                    file(credentialsId: 'frontend-env', variable: 'FRONTEND_ENV')
                ]) {
                    sh '''
                        cp $BACKEND_ENV backend/.env
                        cp $FRONTEND_ENV frontend/.env
                        docker compose down || true
                        docker compose up -d
                    '''
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