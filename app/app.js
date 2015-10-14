var template;
var f,g;
var db;

var CERT  = $rdf.Namespace("http://www.w3.org/ns/auth/cert#");
var CHAT  = $rdf.Namespace("https://ns.rww.io/chat#");
var CURR  = $rdf.Namespace("https://w3id.org/cc#");
var DCT   = $rdf.Namespace("http://purl.org/dc/terms/");
var FACE  = $rdf.Namespace("https://graph.facebook.com/schema/~/");
var FOAF  = $rdf.Namespace("http://xmlns.com/foaf/0.1/");
var LIKE  = $rdf.Namespace("http://ontologi.es/like#");
var LDP   = $rdf.Namespace("http://www.w3.org/ns/ldp#");
var MBLOG = $rdf.Namespace("http://www.w3.org/ns/mblog#");
var OWL   = $rdf.Namespace("http://www.w3.org/2002/07/owl#");
var PIM   = $rdf.Namespace("http://www.w3.org/ns/pim/space#");
var RDF   = $rdf.Namespace("http://www.w3.org/1999/02/22-rdf-syntax-ns#");
var RDFS  = $rdf.Namespace("http://www.w3.org/2000/01/rdf-schema#");
var SIOC  = $rdf.Namespace("http://rdfs.org/sioc/ns#");
var SOLID = $rdf.Namespace("http://www.w3.org/ns/solid/app#");
var URN   = $rdf.Namespace("urn:");

var AUTHENDPOINT = "https://databox.me/";
var PROXY = "https://rww.io/proxy.php?uri={uri}";
var TIMEOUT = 5000;
var DEBUG = true;

var scope = {};
var gg;

$rdf.Fetcher.crossSiteProxyTemplate=PROXY;

var App = angular.module('myApp', [
  'lumx',
  'ngAudio',
]);

App.config(function($locationProvider) {
  $locationProvider
  .html5Mode({ enabled: true, requireBase: false });
});

/**
 * The app controller
 */
App.controller('Main', function($scope, $http, $location, $timeout, $sce, ngAudio, LxNotificationService, LxProgressService, LxDialogService) {
  template = $scope;

  // INIT functions
  //
  /**
   * Initialize app
   */
  $scope.initApp = function() {
    $scope.init();
  };

  /**
   * Initialize
   */
  $scope.init = function() {

    $scope.queue = [];
    $scope.knows = [];
    $scope.preferences = [];
    $scope.storage = [];
    $scope.fetched = {};
    $scope.seeAlso = [];
    $scope.wallet = [];
    $scope.workspaces = [];
    $scope.configurations = [];
    $scope.configurationFiles = [];
    $scope.apps = [];
    $scope.my = {};
    $scope.friends = [];
    $scope.keys = [];
    $scope.initStore();
    $scope.initUI();

    $scope.seeds = [ 'https://melvincarvalho.github.io/data/tmp/webappmarket-seed.ttl' ];

    // start browser cache DB
  	db = new Dexie("chrome:theSession");
  	db.version(1).stores({
  		cache: 'why,quads',
  	});
  	db.open();

    $scope.show = {
        profile: false,
        knows: false,
        queue: false,
        storage: false,
        seeAlso: false,
        wallet: false,
        preferences: false,
        workspaces: false,
        keys: false,
        configurations: true,
    };

    fetchAll();

  };

  /**
   * Init UI
   */
  $scope.initUI = function() {
    $scope.initialized = true;
    $scope.loggedIn = true;
    $scope.loginTLSButtonText = "Login";
    $scope.user = 'http://public.databox.me/card#me';
    $scope.audio = ngAudio.load('audio/button-3.mp3');
  };

  /**
   * Init store
   */
  $scope.initStore = function() {
    // start in memory DB
    g = $rdf.graph();
    f = $rdf.fetcher(g);
    // add CORS proxy
    var PROXY      = "https://data.fm/proxy?uri={uri}";
    var AUTH_PROXY = "https://rww.io/auth-proxy?uri=";
    //$rdf.Fetcher.crossSiteProxyTemplate=PROXY;
    var kb         = $rdf.graph();
    var fetcher    = $rdf.fetcher(kb);
  };



  // RENDER functions
  //
  //
  /**
   * Render the main screen
   */
  $scope.render = function() {
    $scope.renderMain();
    $scope.renderProfile();
    $scope.renderFriends();
    $scope.renderConfigurations();
  };

  /**
   * Render the main screen
   */
  $scope.renderMain = function () {
  };

  /**
   * Render the profile
   */
  $scope.renderProfile = function() {
    if (!$scope.my) return;
    if (!$scope.user) return;

    $scope.my.id = $scope.user;

    var avatar = g.statementsMatching($rdf.sym($scope.my.id), FOAF('img'), undefined);
    if (!avatar.length) {
      avatar = g.statementsMatching($rdf.sym($scope.my.id), FOAF('depiction'), undefined);
    }
    if (avatar.length) {
      $scope.my.picture = avatar[0].object.value;
    }

    var name = g.statementsMatching($rdf.sym($scope.my.id), FOAF('name'), undefined);
    if (name.length) {
      $scope.my.name = name[0].object.value;
    }

  };

  /**
   * Render friends
   */
  $scope.renderFriends = function() {
    for (var i=0; i<$scope.knows.length; i++) {

      var avatar = g.statementsMatching($rdf.sym($scope.knows[i]), FOAF('img'), undefined);
      if (!avatar.length) {
        avatar = g.statementsMatching($rdf.sym($scope.knows[i]), FOAF('depiction'), undefined);
      }

      var name = g.statementsMatching($rdf.sym($scope.knows[i]), FOAF('name'), undefined);

      var friend = { 'id' : $scope.knows[i] };
      if (name.length) {
        friend.name = name[0].object.value;
      }
      if (avatar.length) {
        friend.picture = avatar[0].object.value;
      }

      addToFriends($scope.friends, friend);
    }

    $scope.friends.sort(function(a, b){
      if (!a.picture) return 1;
    });
  };

  /**
   * Render configurations
   */
  $scope.renderConfigurations = function() {
    for (var i=0; i<$scope.configurations.length; i++) {

      var app = { 'id' : $scope.configurations[i] };

      var name = g.statementsMatching($rdf.sym($scope.configurations[i]), SOLID('name'), undefined);
      if (name.length) {
        app.name = name[0].object.value;
      }

      var icon = g.statementsMatching($rdf.sym($scope.configurations[i]), SOLID('icon'), undefined);
      if (icon.length) {
        app.icon = icon[0].object.value;
      }

      var dataSource = g.statementsMatching($rdf.sym($scope.configurations[i]), SOLID('dataSource'), undefined);
      if (dataSource.length) {
        app.dataSource = dataSource[0].object.value;
      }

      var description = g.statementsMatching($rdf.sym($scope.configurations[i]), SOLID('description'), undefined);
      if (description.length) {
        app.description = description[0].object.value;
      }

      var homepage = g.statementsMatching($rdf.sym($scope.configurations[i]), SOLID('homepage'), undefined);
      if (homepage.length) {
        app.homepage = homepage[0].object.value;
      }

      addToApps($scope.apps, app);
    }
  };


  /**
   * Refresh the screen
   */
  $scope.refresh = function() {
    console.log('refresh');
    $scope.render();
  };

  /**
   * Display a tab
   * @param  {String} type which tab
   */
  $scope.display = function(type) {
    $scope.show = {
        profile: false,
        knows: false,
        queue: false,
        storage: false,
        seeAlso: false,
        wallet: false,
        preferences: false,
        workspaces: false,
        keys: false,
        configurations: false,
    };
    $scope.show[type] = true;
    console.log($scope.show);
  };


  // QUEUE functions
  //
  //
  /**
   * Update the queue
   */
  function updateQueue() {
    var i, j;
    var workspaces;
    console.log('updating queue');
    addToQueue($scope.queue, $scope.user);

    for (i=0; i<$scope.seeds.length; i++) {
      addToQueue($scope.queue, $scope.seeds[i]);
    }

    workspaces = g.statementsMatching($rdf.sym($scope.user), PIM('storage'), undefined);
    for (i=0; i<workspaces.length; i++) {
      addToArray($scope.storage, workspaces[i].object.value);
      addToQueue($scope.queue, workspaces[i].object.value);
    }


    var knows = g.statementsMatching($rdf.sym($scope.user), FOAF('knows'), undefined);
    for (i=0; i<knows.length; i++) {
      //console.log(knows[i].object.uri);
      addToArray($scope.knows, knows[i].object.value);
      addToQueue($scope.queue, knows[i].object.value);
      workspaces = g.statementsMatching($rdf.sym(knows[i].object.value), PIM('storage'), undefined);
      for (j=0; j<workspaces.length; j++) {
        addToArray($scope.storage, workspaces[j].object.value);
        addToQueue($scope.queue, workspaces[j].object.value);
      }
    }


    workspaces = g.statementsMatching(undefined, PIM('workspace'), undefined);
    for (i=0; i<workspaces.length; i++) {
      addToArray($scope.workspaces, workspaces[i].object.value);
      addToArray($scope.workspaces, workspaces[i].object.value + '*');
      addToQueue($scope.queue, workspaces[i].object.value);
      addToQueue($scope.queue, workspaces[i].object.value + '*');
    }

    var preferences = g.statementsMatching($rdf.sym($scope.user), PIM('preferencesFile'), undefined);
    for (i=0; i<preferences.length; i++) {
      addToArray($scope.preferences, preferences[i].object.value);
      addToQueue($scope.queue, preferences[i].object.value);
    }

    var configurationFiles = g.statementsMatching(null, RDF('type'), PIM('ConfigurationFile'));
    for (i=0; i<configurationFiles.length; i++) {
      addToArray($scope.configurationFiles, configurationFiles[i].subject.value );
      addToQueue($scope.queue, configurationFiles[i].subject.value);
      var configurations = g.statementsMatching($rdf.sym(configurationFiles[i].subject.value), SOLID('configuration'), undefined);
      for (j=0; j<configurations.length; j++) {
        addToArray($scope.configurations, configurations[j].object.value );
        addToQueue($scope.queue, configurations[j].object.value);
      }
    }



    var wallets = g.statementsMatching($rdf.sym($scope.user), CURR('wallet'), undefined);
    for (i=0; i<wallets.length; i++) {
      addToArray($scope.wallet, wallets[i].object.value);
      addToQueue($scope.queue, wallets[i].object.value);
    }

    var keys = g.statementsMatching($rdf.sym($scope.user), CERT('key'), undefined);
    for (i=0; i<keys.length; i++) {
      addToArray($scope.keys, keys[i].object.value);
      addToQueue($scope.queue, keys[i].object.value);
    }


    var seeAlso = g.statementsMatching($rdf.sym($scope.user), RDFS('seeAlso'), undefined);
    for (i=0; i<seeAlso.length; i++) {
      //console.log('seeAlso found : ' + seeAlso[i].object.value);
      addToArray($scope.seeAlso, seeAlso[i].object.value);
      addToQueue($scope.queue, seeAlso[i].object.value);
    }

  }


  function cache(uri) {
    console.log('caching ' + uri);
    var why = uri.split('#')[0];
    var quads = g.statementsMatching(undefined, undefined, undefined, $rdf.sym(why));

    db.cache.put({"why": why, "quads": quads}). then(function(){
      console.log('cached : ' + quads);
    }).catch(function(error) {
      console.error(error);
    });


  }


  // FETCH functions
  //
  //
  /**
   * Fetch all items in queue
   */
  function fetchAll() {

    updateQueue();

    //if ($scope.queue.length === 0) return;

    for (var i=0; i<$scope.queue.length; i++) {
      if($scope.queue[i]) {
        if (!$scope.fetched[$scope.queue[i]]) {
          $scope.fetched[$scope.queue[i]] = new Date();
          fetch($scope.queue[i]);
        }
      } else {
        console.error('queue item ' + i + ' is undefined');
        console.log($scope.queue);
      }
    }

  }

  /**
   * Fetch a single URI
   * @param  {String} uri The URI to fetch
   */
  function fetch(uri) {
    $scope.fetched[uri] = new Date();
    console.log('fetching : ' + uri);

    var why = uri.split('#')[0];

    db.cache.get(why).then(function(res){
      if (res && res.quads && res.quads.length) {
        console.log('uncached : ');
        console.log('fetched '+ uri +' from cache in : ' + (new Date() - $scope.fetched[uri]) );
        console.log(res);
        for(var i=0; i<res.quads.length; i++) {
          var t = res.quads[i].object.uri;
          if (t) {
            t = $rdf.sym(res.quads[i].object.value);
          } else {
            t = $rdf.term(res.quads[i].object.value);
          }
          //console.log(g.any( $rdf.sym(res.quads[i].subject.value), $rdf.sym(res.quads[i].predicate.value), t, $rdf.sym(res.quads[i].why.value) ));
          if (!g.any( $rdf.sym(res.quads[i].subject.value), $rdf.sym(res.quads[i].predicate.value), t, $rdf.sym(res.quads[i].why.value) )) {
            g.add( $rdf.sym(res.quads[i].subject.value), $rdf.sym(res.quads[i].predicate.value), t, $rdf.sym(res.quads[i].why.value) );
          }

        }
        f.requested[why] = 'requested';
        console.log('fetched '+ uri +' from cache in : ' + (new Date() - $scope.fetched[uri]) );
        $scope.render();
        fetchAll();
      } else {
        var quads = g.statementsMatching(undefined, undefined, undefined, $rdf.sym(why));
        f.nowOrWhenFetched(why, undefined, function(ok, body) {
          cache(uri);
          console.log('fetched '+ uri +' from rdflib in : ' + (new Date() - $scope.fetched[uri]) );
          $scope.render();
          fetchAll();
        });
      }
    }).catch(function(error) {
      console.error(error);
    });

  }


  /**
   * Invalidate a cached URI
   * @param  {String} uri The URI to invalidate
   */
  $scope.invalidate = function(uri) {
    console.log('invalidate : ' + uri);
    uri = uri.split('#')[0];
    f.unload(uri);
    f.refresh($rdf.sym(uri));
    db.cache.delete(uri).then(function() {
      LxNotificationService.success('Successfully deleted Cache');
    });
  };

  // HELPER functions
  //
  //
  /**
   * Add an element to an array once
   * @param {Array} array the array to add to
   * @param {Object} el   the element to add
   */
  function addToArray(array, el) {
    if (!array) return;
    if (array.indexOf(el) === -1) {
      array.push(el);
    }
  }

  /**
   * Add an element to the firends array once
   * @param {Array} array the array to add to
   * @param {Object} el   the element to add
   */
  function addToFriends(array, el) {
		if (!array) return;
		for (var i=0; i<array.length; i++) {
			if (array[i].id === el.id) {
				return;
			}
		}
		array.push(el);
	}

  /**
   * Add an element to the apps array once
   * @param {Array} array the array to add to
   * @param {Object} el   the element to add
   */
  function addToApps(array, el) {
		if (!array) return;
		for (var i=0; i<array.length; i++) {
			if (array[i].id === el.id) {
        array[i] = el;
				return;
			}
		}
		array.push(el);
	}


  /**
   * Add an element to the queue
   * @param {Array} array the array to add to
   * @param {Object} el   the element to add
   */
  function addToQueue(array, el) {
    if (!array) return;
    if (array.indexOf(el) === -1) {
      array.push(el);
    }
  }

  /**
   * Open a modal dialog
   * @param  {String} elem  [description]
   */
  $scope.openDialog = function(elem, reset) {
    if (reset) {
      $scope.resetContact();
    }
    LxDialogService.open(elem);
    $(document).keyup(function(e) {
      if (e.keyCode===27) {
        LxDialogService.close(elem);
      }
    });
  };


  /**
   * TLS Login with WebID
   */
  $scope.TLSlogin = function() {
    $scope.loginTLSButtonText = 'Logging in...';
    $http({
      method: 'HEAD',
      url: AUTHENDPOINT,
      withCredentials: true
    }).success(function(data, status, headers) {
      // add dir to local list
      var user = headers('User');
      if (user && user.length > 0 && user.slice(0,4) == 'http') {
        LxNotificationService.success('Login Successful!');
        $scope.loggedIn = true;
        $scope.user = user;
        fetchAll();
      } else {
        LxNotificationService.error('WebID-TLS authentication failed.');
        console.log('WebID-TLS authentication failed.');
      }
      $scope.loginTLSButtonText = 'Login';
    }).error(function(data, status, headers) {
      LxNotificationService.error('Could not connect to auth server: HTTP '+status);
      console.log('Could not connect to auth server: HTTP '+status);
      $scope.loginTLSButtonText = 'Login';
    });
  };

  /**
   * Logout
   */
  $scope.logout = function() {
    $scope.init();
    LxNotificationService.success('Logout Successful!');
  };

  // SOCKETS
  //
  //
  /**
   * Get wss from URI
   * @param  {String} uri The URI to use
   */
  function getWss(uri) {
    return 'wss://' + uri.split('/')[2];
  }

  /**
   * Send subscrption
   * @param  {String} message The message
   * @param  {String} socket  The socket to send to
   */
  function sendSub(message, socket) {
    socket.send(message);
  }

  /**
   * Connect to a web socket
   * @param  {String} sub Where to subscribe to
   */
  function connectToSocket(sub) {
    if ($scope.socket) return;

    var socket;

    var wss = getWss(sub);
    console.log('connecting to : ' + wss);

    socket = new WebSocket(wss);

    socket.onopen = function(){
      console.log(sub);
      $scope.socket = socket;
    };

    socket.onmessage = function(msg) {
      console.log('Incoming message : ');
      var a = msg.data.split(' ');
      console.log(a[1]);

      $scope.invalidate(a[1]);
      $scope.audio.play();

      Notification.requestPermission(function (permission) {
        // If the user is okay, let's create a notification
        if (permission === "granted") {
          notify = true;
        }
      });

    };

    // delay in case socket is still opening
    var DELAY = 1000;
    setTimeout(function(){
      sendSub('sub ' + sub, socket);
    }, DELAY);


  }


  $scope.initApp();

});

/**
 * Escape URIs filter
 */
App.filter('escape', function() {
  return window.encodeURIComponent;
});
