/** @jsx React.DOM */

require(['common', 'react', 'medium-editor', 'medium-editor-insert', 'typeahead-bundle'], function (common, React) {

	$(window).resize(function resizeCardsPanel() {
		document.getElementById("globalContainer").style.height = (document.body.offsetHeight - document.getElementById("globalContainer").getBoundingClientRect().top + 10)+"px";
	});

	var editor = new MediumEditor('#postBody');
	$('#postBody').mediumInsert({
		editor: editor,
		addons: {
			images: {
				imagesUploadScript: "http://notrelative.com",
				formatData: function (data) {
					console.log(arguments);
				}
			}
		},
	});	//

	var tagStates = new Bloodhound({
		datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
		queryTokenizer: Bloodhound.tokenizers.whitespace,
		local: tagData,
	});

	tagStates.initialize();

	var TagSelectionBox = React.createClass({
		getInitialState: function () {
			return {selectedTagsIds:[]};
		},
		addTag: function (id) {
			if (this.state.selectedTagsIds.indexOf(id) === -1)
				this.setState({ selectedTagsIds: this.state.selectedTagsIds.concat(id) });
		},
		removeTag: function (id) {
			var index = this.state.selectedTagsIds.indexOf(id);
			if (index !== -1) {
				var selected = this.state.selectedTagsIds;
				selected.splice(index, 1);
				this.setState({ selectedTagsIds: selected });
			}
		},
		getSelectedTagsIds: function () {
			return this.state.selectedTagsIds;
		},
		popTag: function (id) {
			var selected = this.state.selectedTagsIds;
			if (selected.length) {
				selected.pop();
				this.setState({ selectedTagsIds: selected });
			}
		},
		componentDidMount: function () {
			$(this.refs.input.getDOMNode()).typeahead({
				highlight: true,
				hint: true,
			}, {
				name: 'tag',
				source: tagStates.ttAdapter(),
				templates: {
					empty: [
						'<div class="empty-message">',
						'Tag não encontrada',
						'</div>'
					].join('\n'),
					suggestion: _.template('<p><%= name %></p>'),
				}
			});
			var self = this;
			$(this.getDOMNode()).on('focusin focus', function () {
				$(self.getDOMNode()).addClass('focused');
				$('#tagInput').focus();
				$(self.getDOMNode()).find(".placeholder").hide();
			});
			$(this.refs.input.getDOMNode())
				.on('focusout', function () {
					$('#tagSelectionBox').removeClass('focused');
				})
				.on('keydown', function (e) {
					var key = e.keyCode || e.charCode;
					if (key == 8 && e.target.value.match(/^\s*$/)) {
						self.popTag();
					}
				});
			var self = this;
			$(this.refs.input.getDOMNode()).on('typeahead:selected', function (evt, obj) {
				self.addTag(obj.id);
			});
		},
		render: function () {
			var self = this;
			var tags = _.map(this.state.selectedTagsIds, function (tagId) {
				return (
					<li className="tag">
						<span>
							{self.props.data[tagId].name}
						</span>
						<span onClick={function(){self.removeTag(tagId)}}><i className="icon-times"></i></span>
					</li>
				);
			});
			return (
				<div className={tags.length?'':' empty '} id="tagSelectionBox">
					<i className="iconThumbnail iconThumbnailSmall icon-tags"></i>
					<ul>{
						tags.length?
						tags
						:(
							<div className="placeholder">Tópicos relacionados</div>
						)
					}</ul>
					<input ref="input" type="text" id="tagInput" />
				</div>
			);
		},
	});
	
	var tagSelectionBox = React.renderComponent(<TagSelectionBox data={_.indexBy(tagData,'id')} />, document.getElementById('tagSelectionBoxWrapper'));

	// var page = React.createClass({
	// 	render: function () {
	// 		return (
	// 			<tagSelectionBox>
	// 		);
	// 	}
	// })

	$("#postBody").on('input keyup', function () {
		function countWords (s){
			var ocs = s.slice(0,s.length-4)
				.replace(/(^\s*)|(\s*$)/gi,"")
				.replace(/[ ]{2,}/gi," ")
				.replace(/\n /,"\n")
				.split(' ');
			return ocs[0]===''?(ocs.length-1):ocs.length;
		}
		var count = countWords($('#postBody').text());
		$(".wordCounter").html(count?(count==1?count+" palavra":count+" palavras"):'');
	});

	$(".autosize").autosize();
	$(".autosize").keypress(function (e) {
		if (e.keyCode == 13) {
			e.preventDefault();
		}
	});

	$("[data-action=send-post]").click(function () {
		console.log('body', editor.serialize().postBody)
		var data = {
			body: editor.serialize().postBody.value,
			title: $("[name=post_title]").val(),
			type: $("[name=post_type]").val(),
			tags: tagSelectionBox.getSelectedTagsIds(),
		};
		console.log(data)
		$.ajax({
			dataType: 'JSON',
			data: data,
			url: "/api/me/timeline/posts",
			type: "POST",
		}).done(function (response) {
			if (response.error)
				alert(response.error)
			else {
				window.location.href = response.data.path;
			}
		});
	});
});