Template.editAreaPage.rendered = function() {
	$('.colorpicker-component-left').colorpicker( { 'align': 'left' });

};


AutoForm.addHooks("areaForm", {
  after: {
	  update: function(error, result, template) {
      if(error) {
        Flash.danger(error);
      } else {
        Router.go('mapPage');
        Flash.success("Area succesfully updated!");
      }
    }
  }
});
