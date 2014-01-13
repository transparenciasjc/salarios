var url = 'http://www.sjc.sp.gov.br/servicos/portal_da_transparencia/salarios.aspx',
    casper = require('casper').create(),
    fs = require('fs'),
    results = [];

if (casper.cli.has(0)) {
    var month = casper.cli.get(0);
}
else {
    throw "Undefined: month. Usage: casperjs scraper/main.js <month>";
}

casper.start();

casper.currentPage = function() {
    return parseInt(this.fetchText('.paginador_atual'));
}

casper.extractTable = function() {
    return this.evaluate(function() {
        var result = [];
        $('.fonte_grid_transparencia tr').slice(1).each(function(_, tr) {
            result.push($(tr).find('td').map(function(_, td) {
                return $(td).text();
            }).get().join(';'));
        });
        return result;
    });
}

casper.iterPages = function() {
    var page = this.currentPage();
    this.echo('Page ' + page);
    results = results.concat(this.extractTable());
    try {
        this.clickLabel('Próxima', 'a');
    }
    catch (err) {
        return;
    }
    this.waitForSelectorTextChange('.paginador_atual', this.iterPages);
}

casper.saveResults = function(filename) {
    fs.write(filename, results.join('\n'), 'w');
}

casper.selectDate = function(date) {
    this.fillSelectors('form#aspnetForm', {
        '#corpo select': date
    });
}

casper.thenOpen(url, function() {
    this.echo(this.getTitle());
    this.selectDate(month);
    this.click('input[type=submit][value=Consultar]');
    this.waitForSelector('.fonte_grid_transparencia', this.iterPages);
});

casper.then(function() {
    var outputFile = 'data/' + month + ".csv";
    this.saveResults(outputFile);
});

casper.then(function() {
    casper.exit();
});

casper.run();
