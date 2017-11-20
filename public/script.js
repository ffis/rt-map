/* global angular */
(function(angular){
	'use strict';

	angular.module('maprt', ['ngResource', 'angularFileUpload']).factory('Config', ['$resource', function($resource){
		return $resource('/api/config');
	}]).run(['$rootScope', 'Config', function($rootScope, Config){
		$rootScope.config = Config.get();
	}]).controller('Dashboard', ['$scope', 'FileUploader', function($scope, FileUploader){
		$scope.uploader = new FileUploader({url: '/api/upload'});
	}]);

})(angular);
