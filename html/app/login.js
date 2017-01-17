(function(){
function authInterceptor(API, auth) {
    return {
        // automatically attach Authorization header
        request: function(config) {
            var token = auth.getToken();
            if(config.url.indexOf(API) === 0 && token) {
                config.headers.Authorization = 'JWT ' + token;
            } 

            return config;
        },

        // If a token was sent back, save it
        response: function(res) {
            if(res.config.url.indexOf(API) === 0 && res.data.token) {
                auth.saveToken(res.data.token);
            }

            return res;
        }
    }
}

function authService($window) {
    var self = this;

    self.parseJwt = function(token) {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace('-', '+').replace('_', '/');
        return JSON.parse($window.atob(base64));
    }

    self.saveToken = function(token) {
        $window.localStorage['jwtToken'] = token;
    }

    self.getToken = function() {
        return $window.localStorage['jwtToken'];
    }
}

function userService($http, API, auth) {
    var self = this;

    self.getQuote = function() {
        return $http.get(API + '/leagues')
    };

    self.register = function(email, username, password, confirm_password) {
        return $http.post(API + '/auth/register', {
            'email': email,
            'username': username,
            'password': password,
        })
    };

    self.login = function(username, password) {
        return $http.post(API + '/auth/login', {
            username: username,
            password: password
        })
    };

    self.isAuthed = function() {
        var token = self.getToken();

        if(token) {
            return true;
        } else {
            return false;
        }
    };

    self.logout = function() {
        $window.localStorage.removeItem('jwtToken');
    };
}

// We won't touch anything in here
function MainCtrl(user, auth) {
    var self = this;

    function handleRequest(res) {
        var token = res.data ? res.data.token : null;
        if(token) { console.log('JWT:', token); }
        self.message = res.data.message;
    }

    self.login = function() {
        user.login(self.username, self.password)
        .then(handleRequest, handleRequest)
    }

    self.register = function() {
        if(self.password != self.confirmPassword) {
            self.signupmessage = "Your passwords do not match";
            return false;
        }
        
        user.register(self.email, self.username, self.password, self.confirm_password)
        .then(handleRequest, handleRequest)
    }

    self.getQuote = function() {
        user.getQuote()
        .then(handleRequest, handleRequest)
    }

    self.logout = function() {
        auth.logout && auth.logout()
    }

    self.isAuthed = function() {
        return auth.isAuthed ? auth.isAuthed() : false
    }
}

angular.module('StrayLogin', [])
.factory('authInterceptor', authInterceptor)
.service('user', userService)
.service('auth', authService)
.constant('API', 'https://api.strayadmin.com')
.config(function($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
})
.controller('Main', MainCtrl)
})();