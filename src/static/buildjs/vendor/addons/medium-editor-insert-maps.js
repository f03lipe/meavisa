!function(n){n.fn.mediumInsert.registerAddon("maps",{init:function(){this.$el=n.fn.mediumInsert.insert.$el},insertButton:function(n){var t="Map";return"fontawesome"==n&&(t='<i class="fa fa-map-marker"></i>'),'<button data-addon="maps" data-action="add" class="medium-editor-action medium-editor-action-image mediumInsert-action">'+t+"</button>"},add:function(t){n.fn.mediumInsert.insert.deselect(),t.append('<div class="mediumInsert-maps">Map - Coming soon...</div>')}})}(jQuery);
//# sourceMappingURL=medium-editor-insert-maps.js.map