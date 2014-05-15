
require(['common', 'components.cards'], function (common, wall) {
	wall.initialize();

	$("[data-action=edit-profile]").click(function () {
		$(".profileWrapper").addClass('editing');
	});

	$("[data-action=save-profile]").click(function () {
		var profile = {
			bio: $("[name=bio]").val(),
			nome: $("[name=name]").val(),
			home: $("[name=home]").val(),
			location: $("[name=location]").val(),
		};

		$.ajax({
			type: 'PUT',
			dataType: 'JSON',
			url: '/api/me/profile',
			data: {
				profile: profile
			}
		}).done(function (response) {
			if (response.error) {
			} else {
				$(".profileWrapper").removeClass('editing');
				$(".profileOutput.bio").html(profile.bio);
				$(".profileOutput.name").html(profile.name);
				$(".profileOutput.home").html(profile.home);
				$(".profileOutput.location").html(profile.location);
			}
		}).fail(function () {
		});
	})

});