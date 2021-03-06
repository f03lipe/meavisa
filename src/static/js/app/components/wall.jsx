/** @jsx React.DOM */

/*
** wall.js
** Copyright QILabs.org
** BSD License
** by @f03lipe
*/

define([
	'jquery', 'backbone', 'components.postModels', 'components.postViews', 'underscore', 'react', 'components.postForms'],
	function ($, Backbone, postModels, postViews, _, React, postForms) {

	var FlashDiv = React.createClass({
		getInitialState: function () {
			return {message:'', action:''};
		},
		message: function (text, className, wait) {
			var wp = this.refs.message.getDOMNode();
			$(wp).fadeOut(function () {
				function removeAfterWait() {
					setTimeout(function () {
						$(this).fadeOut();
					}.bind(this), wait || 5000);
				}
				$(this.refs.messageContent.getDOMNode()).html(text);
				$(wp).prop('class', 'message '+className).fadeIn('fast', removeAfterWait);
			}.bind(this)); 
		},
		hide: function () {
			$(this.refs.message.getDOMNode()).fadeOut();
		},
		render: function () {
			return (
				<div ref="message" className="message" style={{ 'display': 'none' }} onClick={this.hide}>
					<span ref="messageContent"></span> <i className="close-btn" onClick={this.hide}></i>
				</div>
			);
		},
	})

	setTimeout(function updateCounters () {
		$('[data-time-count]').each(function () {
			this.innerHTML = calcTimeFrom(parseInt(this.dataset.timeCount), this.dataset.timeLong);
		});
		setTimeout(updateCounters, 1000);
	}, 1000);

	var FullPostView = React.createClass({

		componentWillMount: function () {
			var update = function () {
				this.forceUpdate(function(){});
			}
			this.props.model.on('add reset remove change', update.bind(this));
		},

		close: function () {
			this.props.page.destroy(true);
		},

		onClickEdit: function () {
			window.location.href = this.props.model.get('path')+'/edit';
		},

		onClickTrash: function () {
			if (confirm('Tem certeza que deseja excluir essa postagem?')) {
				this.props.model.destroy();
				this.close();
				// Signal to the wall that the post with this ID must be removed.
				// This isn't automatic (as in deleting comments) because the models on
				// the wall aren't the same as those on post FullPostView.
				console.log('id being removed:',this.props.model.get('id'))
				app.postList.remove({id:this.props.model.get('id')})
				$(".tooltip").remove(); // fuckin bug
			}
		},

		toggleVote: function () {
			console.log('oi')
			this.props.model.handleToggleVote();
		},

		componentDidMount: function () {
			var self = this;
			$(this.getDOMNode().parentElement).on('click', function onClickOut (e) {
				if (e.target === this || e.target === self.getDOMNode()) {
					self.close();
					$(this).unbind('click', onClickOut);
				}
			});
		},

		render: function () {
			var post = this.props.model.attributes;
			var author = this.props.model.get('author');
			var postType = this.props.model.get('type');
			if (postType in postViews) {
				var postView = postViews[postType];
			} else {
				console.warn("Couldn't find view for post of type "+postType);
				return <div></div>;
			}

			return (
				<div className="postBox" data-post-type={this.props.model.get('type')} data-post-id={this.props.model.get('id')}>
					<i className="close-btn" data-action="close-page" onClick={this.close}></i>
					<div className="postCol">
						<postView model={this.props.model} parent={this} />
					</div>
				</div>
			);
		},
	});

	var FollowList = React.createClass({
		close: function () {
			this.props.page.destroy(true);
		},
		render: function () {
			// <button className="btn-follow" data-action="unfollow"></button>
			var items = _.map(this.props.list, function (person) {
				return (
					<li>
						<a href={person.path}>
							<div className="avatarWrapper">
								<div className="avatar" style={ {background: 'url("'+person.avatarUrl+'")'} }></div>
							</div>
							<span className="name">{person.name}</span>
						</a>
					</li>
				);
			});
			if (this.props.isFollowin)
				var label = this.props.profile.name+" segue "+this.props.list.length+" pessoas";
			else
				var label = this.props.list.length+" pessoas seguem "+this.props.profile.name;

			return (
				<div className="cContainer">
					<i className="close-btn" onClick={this.close}></i>
					<div className="listWrapper">
						<div className="left">
							<button data-action="close-page" onClick={this.close}>Voltar</button>
						</div>
						<label>{label}</label>
						{items}
					</div>
				</div>
			);
		},
	});

	var NotificationsPage = React.createClass({
		getInitialState: function () {
			return {notes:[]};
		},
		close: function () {
			this.props.page.destroy(true);
		},
		componentDidMount: function () {
			var self = this;
			$.ajax({
				url: '/api/me/notifications?limit=30',
				type: 'get',
				dataType: 'json',
			}).done(function (response) {
				if (response.error) {
					if (response.message)
						app.alert(response.message, 'error');
				} else {
					self.setState({notes:response.data});
				}
			});
		},
		render: function () {
			var notes = _.map(this.state.notes, function (item) {
				return (
					<li className="notification" key={item.id}
						data-seen={item.seen} data-accessed={item.accessed}>
						<img className="thumbnail" src={item.thumbnailUrl} />
						<p onClick={function(){window.location.href=item.url} }>
							{item.msg}
						</p>
						<time data-time-count={1*new Date(item.dateSent)}>
							{window.calcTimeFrom(item.dateSent)}
						</time>
					</li>
				);
			});

			return (
				<div className="cContainer">
					<i className="close-btn" onClick={this.close}></i>
					<ul className="notificationsWrapper">
						{notes}
					</ul>
				</div>
			)
		},
	});

	var CardsPanelView = React.createClass({
		getInitialState: function () {
			return {selectedForm:null};
		},
		componentWillMount: function () {
			var self = this;
			function update (evt) {
				self.forceUpdate(function(){});
			}
			_.defer(function () {
				app.postList.on('add change remove reset statusChange', update, this);
			});
		},
		render: function () {
			var self = this;

			var cards = app.postList.map(function (post) {
				if (post.get('__t') === 'Post')
					return postViews.CardView({model:post, key:post.id});
				return null;
			});
			return (
				<div className="timeline">
					{cards}
				</div>
			);
		},
	});

	var Page = function (component, dataPage, noNavbar, opts) {

		var opts = _.extend({}, opts);

		component.props.page = this;
		var e = document.createElement('div');
		this.e = e;
		this.c = component;
		if (!noNavbar)
			$(e).addClass('pContainer');
		$(e).addClass((opts && opts.class) || '');
		$(e).addClass('invisible').hide().appendTo('body');
		if (dataPage)
			e.dataset.page = dataPage;

		React.renderComponent(component, e, function () {
			$(e).show().removeClass('invisible');
		});

		if (opts.scrollable)
			$(component.getDOMNode()).addClass('scrollable');

		this.destroy = function (navigate) {
			$(e).addClass('invisible');
			React.unmountComponentAtNode(e);
			$(e).remove();
			if (navigate) {
				app.navigate('/', {trigger:false});
			}
		};
	};

	// Central functionality of the app.
	var WorkspaceRouter = Backbone.Router.extend({
		
		initialize: function () {
			console.log('initialized')
			window.app = this;
			this.pages = [];
			this.renderWall(window.conf.postsRoot || '/api/me/timeline/posts');
			this.fd = React.renderComponent(<FlashDiv />, $('<div id="flash-wrapper">').appendTo('body')[0]);
		},

		alert: function (message, className, wait) {
			this.fd.message(message, className, wait);
		},

		closePages: function () {
			for (var i=0; i<this.pages.length; i++) {
				this.pages[i].destroy();
			}
			this.pages = [];
		},

		routes: {
			'new':
				function () {
					this.closePages();
					var p = new Page(postForms.create({user: window.user}), 'createPost');
					this.pages.push(p);
				},
			'notifications':
				function () {
					this.closePages();
					var p = new Page(<NotificationsPage />, 'notes', true);
					this.pages.push(p);
				},
			'following':
				function () {
					var self = this;
					$.getJSON('/api/users/'+user_profile.id+'/following')
						.done(function (response) {
							if (response.error)
								alert('vish fu')
							self.renderList(response.data, {isFollowing: true});
						})
						.fail(function (response) {
							alert('vish');
						})
				},
			'followers':
				function () {
					var self = this;
					$.getJSON('/api/users/'+user_profile.id+'/followers')
						.done(function (response) {
							if (response.error)
								alert('vish fu')
							self.renderList(response.data, {isFollowing: false});
						})
						.fail(function (response) {
							alert('vish');
						})
				},
			'posts/:postId':
				function (postId) {
					this.closePages();
					$.getJSON('/api/posts/'+postId)
						.done(function (response) {
							if (response.data.parentPost) {
								return app.navigate('/posts/'+response.data.parentPost, {trigger:true});
							}
							console.log('response, data', response)
							var postItem = new postModels.postItem(response.data);
							var p = new Page(<FullPostView model={postItem} />, 'post');
							this.pages.push(p);
						}.bind(this))
						.fail(function (response) {
							app.alert('Ops! Não conseguimos encontrar essa publicação. Ela pode ter sido excluída.', 'error');
						}.bind(this));
				},
			'posts/:postId/edit':
				function (postId) {
					this.closePages();
					$.getJSON('/api/posts/'+postId)
						.done(function (response) {
							if (response.data.parentPost) {
								return alert('eerrooo');
							}
							console.log('response, data', response)
							var postItem = new postModels.postItem(response.data);
							var p = new Page(postForms.edit({model: postItem}), 'createPost');
							this.pages.push(p);
						}.bind(this))
						.fail(function (response) {
							alert("não achei");
						}.bind(this));
				},
			'':
				function () {
					this.closePages();
					// return;
					setTimeout(function () {
						this.renderWall(window.conf.postsRoot || '/api/me/timeline/posts');
					}.bind(this), 2000);
				},
		},

		renderList: function (list, opts) {
			var p = new Page(<FollowList list={list} isFollowing={opts.isFollowing} profile={user_profile} />,
				'listView', true, {scrollable: true});
			this.pages.push(p);
		},

		renderWall: function (url) {
			this.postList = new postModels.postList([], {url:url});
			if (!this.postWall) {
				this.postWall = React.renderComponent(<CardsPanelView />,
					document.getElementById('resultsContainer'));
				_.defer(function () {
					this.postList.fetch({reset:true});
				}.bind(this));
				var fetchMore = this.postList.tryFetchMore.bind(app.postList);
				$('#globalContainer').scroll(_.throttle(function() {
					if ($('#cards').outerHeight()-($('#globalContainer').scrollTop()+$('#globalContainer').outerHeight())< 5) {
						console.log('fetching more')
						fetchMore();
					}
				}, 300));
			}
		},
	});

	$("#globalContainer").scroll(function () {
		if ($("#globalContainer").scrollTop() > 0) {
			$("body").addClass('hasScrolled');
		} else {
			$("body").removeClass('hasScrolled');
		}
	});

	if (!!$("#globalHead").length) {
		// $(document).scroll(triggerCalcNavbarFixed);
		$("#globalContainer").scroll(triggerCalcNavbarFixed);
		function triggerCalcNavbarFixed () {
			// if (($(document).scrollTop()+$('nav.bar').outerHeight()
			// 	-($("#globalHead").offset().top+$('#globalHead').outerHeight())) >= 0) {
			if ($("#globalContainer").scrollTop()-$("#globalHead").outerHeight() >= 0) {
				$("body").addClass('headerPassed');
			} else {
				$("body").removeClass('headerPassed');
			}
		}
		triggerCalcNavbarFixed();
	} else {
		$("body").addClass('noHeader');
	}

	return {
		initialize: function () {
			new WorkspaceRouter;
			Backbone.history.start({ pushState:false, hashChange:true });
			// Backbone.history.start({ pushState:true });

		}
	};
});
