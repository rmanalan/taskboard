$script.path = '/js/';
$script(['libs/jquery.tmpl.min', 'libs/spine.min', 'plugins'], 'core');

$script.ready('core', function() {
	
  $script(['projects', 'cards'], 'app');

}).ready('app', function() {

	var AppController = Spine.Controller.create({
		init: function() {
			this.routes({

				'': function() {
					this.navigate('/');
				},

				// Default project
				'/': function() {
					currProj = Project.findByAttribute('main', true);
					CurrentProjectController.render(currProj);
					CardColumnsController.init();
				},

				// Project detail
				'/:id': function(id) {
					currProj = Project.find(id);
					if (currProj.main) {
						this.navigate('/');
						return;
					}
					CurrentProjectController.render(currProj);
					CardColumnsController.init();
				}

			});
		}
	}).init();

	Spine.Route.setup();

});

