'use strict';

(function () {

  $(document).ready(function () {
    // Tell Tableau we'd like to initialize our extension
    tableau.extensions.initializeAsync().then(function () {
      const savedSheetName = tableau.extensions.settings.get('sheet');
      if (savedSheetName) {returnURL(savedSheetName)}
      else {showChooseSheetDialog();}
      initializeButtons();
    });
  });

  let unregisterEventHandlerFunction;

  function showChooseSheetDialog(){

    $('#choose_sheet_buttons').empty();

    $('#dashboard_title').text(tableau.extensions.dashboardContent.dashboard.name);

    const worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;

    worksheets.forEach(function (worksheet) {

      const button = $("<button type='button' class='btn btn-default btn-block'></button>");
      button.text(worksheet.name);

      // Create an event handler for when this button is clicked
      button.click(function () {
        tableau.extensions.settings.set('sheet',worksheet.name);
        tableau.extensions.settings.saveAsync().then(function(){
          $('#choose_sheet_dialog').modal('toggle');
          returnURL(worksheet.name);
        });

      });

      $('#choose_sheet_buttons').append(button);
    });

    // Show the dialog
    $('#choose_sheet_dialog').modal('toggle');

   }

  function showImage () {
    // Clear out the existing list of sheets
    $('#choose_sheet_buttons').empty();

    // Set the dashboard's name in the title
    const dashboardName = tableau.extensions.dashboardContent.dashboard.name;



    // The first step in choosing a sheet will be asking Tableau what sheets are available
    const worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;

    // Next, we loop through all of these worksheets add add radio buttons for each one
    worksheets.forEach(function (worksheet) {
      // Declare our new button which contains the sheet name
      if (worksheet.name == "Collection Sales") {

        returnURL(worksheet.name);

      }

    });



    // Show the dialog

  }

  function returnURL(worksheetName){

    if (unregisterEventHandlerFunction) {unregisterEventHandlerFunction();}

    const worksheet = getSelectedSheet(worksheetName);

    worksheet.getSummaryDataAsync().then(function (worksheetData) {

      // hardcoding the dimension used for the image urls
      const linkdim = worksheetData.columns.find(c => c.fieldName === 'Link').index;
      //hardcoding the dimension used for the sorting
      const catdim = worksheetData.columns.find(c => c.fieldName === 'Sub-Category').index;

      const data = worksheetData.data.sort(comparator(catdim));
      const urls = data.map(function(value,index){return value[linkdim].value;});

      function comparator(catdim) {
        return function(a, b) {
          if (a[catdim].value === b[catdim].value) {return 0;}
          else {return (a[catdim].value < b[catdim].value) ? -1 : 1;}
        }
      }

      displayURL(urls);

    });

    unregisterEventHandlerFunction = worksheet.addEventListener(tableau.TableauEventType.FilterChanged, function (selectionEvent) {
      returnURL(worksheetName);
    });

  }

  function getSelectedSheet (worksheetName) {
    // go through all the worksheets in the dashboard and find the one we want
    return tableau.extensions.dashboardContent.dashboard.worksheets.find(function (sheet) {
      return sheet.name === worksheetName;
    });
  }

  function initializeButtons () {
    $('#show_choose_sheet_button').click(showChooseSheetDialog);
  }

  function displayURL(data){
    $('#data_table_wrapper').empty();
    $('#data_table_wrapper').append(`<table id='data_table' class='table table-bordered'></table>`);

    let top = $('#data_table_wrapper')[0].getBoundingClientRect().top;
    let left = $('#data_table_wrapper')[0].getBoundingClientRect().left;
    let height = $("body").height()-20;
    let width = $("body").width()-40;
    // alert(height);
    // let width = $(document).width() - left - 50;
    let item_height = Math.floor(height/data.length)-20;
    let item_size= Math.min(item_height,width);
    let pictures = [];
    for (const e of data){
      pictures.push([`<img src='${e}' style='height:${item_size}px; width:${item_size}px'>`])
    }

    $('#data_table').DataTable({
      data: pictures,
      columns: [{title:""}],
      // autoWidth: false,
      // deferRender: true,
      // scroller: true,
      scrollY: height,
      iDisplayLength : 100,
      sDom: 't'
    });

  }

})();
