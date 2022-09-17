echo "Updating system..."
sudo apt update -y
sudo apt upgrade -y

echo "Installing docker and docker-compose"
sudo apt install docker.io docker-compose

echo "Starting smarthome frontend"
read -p "Please enter your sh address (e.g. http://192.168.1.4) without the last slash:" address
cp docker-compose.yaml docker-compose.prod.yml

echo "Preparing deployment"
sed -i "s/REACT_APP_SERVER_URL=.*/REACT_APP_SERVER_URL=${address}/g" docker-compose.prod.yml

echo "Deploying the app"
docker-compose up -d --build