# -*- mode: ruby -*-
# vi: set ft=ruby :
VAGRANTFILE_API_VERSION = "2"

$script = <<SCRIPT
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -

apt-get update
apt-get -y upgrade
apt-get -y install git build-essential nodejs python-gdal

git clone https://github.com/ffis/rt-map /vagrant/rt-map

cd /vagrant/rt-map
npm install
npm run build
mkdir -p /vagrant/rt-map/data

node . &

SCRIPT

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
	config.vm.box = "ubuntu/trusty64"
	config.vm.provider "virtualbox" do |v|
		v.memory = 2048
	end
	config.vm.network "forwarded_port", guest: 10101, host: 10101
	config.vm.provision "shell", inline: $script
end
