$('#test-tmpl').html();

// Current project
$('#currproj').html("Project XYZ");

// Projects
var Project = Spine.Model.setup('Project', ['name', 'description', 'members']);
Project.extend(Spine.Model.Local);
Project.nameSort = function(a, b) {
	return a.name > b.name;
};

var Projects = Spine.Controller.create({
	el: $('#listproj'),
	init: function() {
		Project.bind('refresh change', this.proxy(this.render));
	},
	template: function(items) {
		return $("#projlist-tmpl").tmpl(items);
	},
	sortByName: function(items) {
		return items.sort(function(a, b) {
			return a.name > b.name;
		});
	},
	render: function() {
		this.el.html(this.template(this.sortByName(Project.all())));
	}
});

Projects.init();
Project.fetch();

