/**
 * static_main.js
 * @author peseus@qq.com
 */

var jsdom = require('jsdom').jsdom;
var fs = require('fs');
var showdown = require('showdown');

var mustache = require('./mustache.js');
var _ = require('./underscore.js')._;

var proj_path = '../peseus.github.io';
var proj_index_template = proj_path + '/index.template.html';
var proj_config = proj_path + '/post/index.json';
var cate_prefix = "cat-";
var article_dir = 'article';
var index_cate_tag = "index";
var index_cate_name = "首页";

var proj_config_data = require(proj_config);
var my_global = {};

function createMainData() {
	var main_data = {};
	main_data.site_name = proj_config_data.site_name;
	main_data.copyright = proj_config_data.copyright;
	var cates = [{'name': index_cate_tag, 'text': index_cate_name}];
	for (var i = 0; i < proj_config_data.cates.length; i++) {
		var cate_tag = proj_config_data.cates[i].name;
		if ('undefined' !== typeof my_global.cates[cate_tag]) {
			cates[cates.length] = proj_config_data.cates[i];
		}
	}
	main_data.navlist = _.map(cates, function(cate) {
        return {
            link: '/' + cate_prefix + cate.name + '/page-1.html',
            text: cate.text
        };
    });
	return main_data;
}

function createLinkData () {
    var link_data = {"links": proj_config_data.links};
    return link_data;
}

function createPagebarData (cate_tag, total_page, page_num){
    var pagebar_data = {};
    var pages = [];
    for (var i = 1; i <= total_page; i++) {
        pages[i - i] = {"num" : i} ;
    }
    pagebar_data.cate_tag = cate_prefix + cate_tag;
    pagebar_data.pages = pages;
    pagebar_data.num_up = page_num - 1 <= 0 ? 1 : page_num - 1;
    pagebar_data.num_next = parseInt(page_num, 10) + 1 > total_page ? total_page : parseInt(page_num, 10) + 1;
    return pagebar_data;
}

function createPersonalData () {
	return proj_config_data.personal;
}

function createSidebarData (cate) {
    var sidebar_data = {};
    var articles = proj_config_data.articles;
    if(null !== cate && cate !== index_cate_tag) {
        articles = _.filter(articles, function(article) {
            return article.cate == cate;
        });
    }

    sidebar_data.months = _.groupBy(articles, function(article) {
        return article.file.substring(0, 7);
    });

    sidebar_data.months = _.map(sidebar_data.months, function(value, key) {
        return {
            month: key,
            articles: _.map(value, function(article) {
            	var link_addr = '/' + article_dir + article.file + '.html';
                return {
                    link: link_addr,
                    text: article.title
                };
            })
        };
    });
    return sidebar_data;
}

//生成的HTML有
// index.hml = /_/page1.html
// /_/pagex.html x=[1,N]
// /caty/pagex.html caty=[...]. x=[1,N]
my_global.index = {};

// 读取文章
var articles = proj_config_data.articles;
my_global.article = {};
my_global.cates = {};
my_global.cates[index_cate_tag] = [];
for (var i = 0; i < articles.length; i++) {
	var article_meta = articles[i];
	var title = article_meta.title;
	var file = article_meta.file;
	var cate = article_meta.cate;
	if ('undefined' === typeof my_global.cates[cate]) {
		my_global.cates[cate] = [];
	}
	my_global.cates[cate][my_global.cates[cate].length] = file;
	my_global.cates[index_cate_tag][my_global.cates[index_cate_tag].length] = file;
	var file_path = proj_path + '/post/' + file + '.md';
	var file_content = fs.readFileSync(file_path, 'utf8');
	if (false === file_content) {
		throw "read " + file_path + " failed";
	}
	my_global.article[file] = {};
	var markdown = new showdown.converter();
	my_global.article[file].html = markdown.makeHtml(file_content);
	if(file_content.length >= 200) {
		my_global.article[file].abstract_html = markdown.makeHtml(file_content.substring(0, 200));
	} else {
		my_global.article[file].abstract_html = markdown.makeHtml(file_content);
	}
}

// 读取首页文件
fs.readFile(proj_index_template, 'utf8', function (error, index_template) {
	if (error) {
		throw error;
	}
	var document = jsdom(index_template);
	var window = document.parentWindow;
	my_global.index.document = document;
	my_global.index.window = window;
	
	my_global.index.template = {};
	my_global.index.template.main_template = document.getElementById('tpl-main').innerHTML; 		//jQuery("#tpl-main").text();
	my_global.index.template.sidebar_template = document.getElementById('tpl-sidebar').innerHTML; 	//jQuery("#tpl-sidebar").text();
	my_global.index.template.personal_template = document.getElementById('tpl-person').innerHTML;
	my_global.index.template.link_template = document.getElementById('tpl-link').innerHTML; 		//jQuery("#tpl-link").text();
	my_global.index.template.pagebar_template = document.getElementById('tpl-pagebar').innerHTML; 	//jQuery("#tpl-pagebar").text();
	my_global.index.template.duoshuo_template = document.getElementById('tpl-duoshuo').innerHTML; 	//jQuery("#tpl-duoshuo").text();
	
//	jsdom.jQueryify(window, './jquery.js', function (w, jQuery) {
//		// 把模板文件都读出来
//		console.log(w.document.innerHTML);
//		my_global.index.template = {};
//		my_global.index.template.main_template = jQuery("#tpl-main").text();
//		my_global.index.template.sidebar_template = jQuery("#tpl-sidebar").text();
//		my_global.index.template.personal_template = jQuery("#tpl-person").text();
//		my_global.index.template.link_template = jQuery("#tpl-link").text();
//		my_global.index.template.pagebar_template = jQuery("#tpl-pagebar").text();
//		my_global.index.template.duoshuo_template = jQuery("#tpl-duoshuo").text();
//	});
});

function createArticleView(article, article_info) {
	var dst_dir = proj_path + '/' + article_dir;
	var dst_file = proj_path + '/' + article_dir + '/' + article + '.html';
	var article_html = article_info.html;
	
	var link_data = createLinkData();
	var main_data = createMainData();
	var personal_data = createPersonalData();
	var sidebar_data = createSidebarData(null);
	
	try {
		fs.mkdirSync(dst_dir);
	}
	catch (e) {
		if (e.code !== 'EEXIST') {
			throw e;
		}
	}
	var link_html = mustache.render(my_global.index.template.link_template, link_data);
	var main_html = mustache.render(my_global.index.template.main_template, main_data);
	var personal_html = mustache.render(my_global.index.template.personal_template, personal_data);
	var sidebar_html = mustache.render(my_global.index.template.sidebar_template, sidebar_data);
	
	// 不能直接操作原文，只能对副本进行操作
	var document = jsdom('');
	document.innerHTML = my_global.index.document.innerHTML;
	var window = document.parentWindow;
	
	document.getElementsByClassName('main-body')[0].innerHTML = main_html;
	document.getElementsByClassName('sidebar-nav')[0].innerHTML = sidebar_html;
	document.getElementsByClassName('sidebar-links')[0].innerHTML = link_html;
	document.getElementsByClassName('personal')[0].innerHTML = personal_html;
	
	// 插入文章内容
	document.getElementsByClassName('article-content')[0].innerHTML = article_html;
	
	var dels = document.getElementsByClassName('jsdom');
	for (var i = 0; i < dels.length; i++) {
		dels[0].parentNode.removeChild(dels[0]);
	}
	var del = document.getElementById('tpl-main');
	del.parentNode.removeChild(del);
	del = document.getElementById('tpl-sidebar');
	del.parentNode.removeChild(del);
	del = document.getElementById('tpl-person');
	del.parentNode.removeChild(del);
	del = document.getElementById('tpl-link');
	del.parentNode.removeChild(del);
	del = document.getElementById('tpl-pagebar');
	del.parentNode.removeChild(del);
	fs.writeFileSync(dst_file, document.innerHTML);
	console.log('写静态页面：' + dst_file + " 完成");
}

function createPageView(cate_tag, total_page, page_num) {
	var cate_artices = my_global.cates[cate_tag];
	var link_data = createLinkData();
	var main_data = createMainData();
	var pagebar_data = createPagebarData(cate_tag, total_page, page_num);
	var personal_data = createPersonalData();
	var sidebar_data = createSidebarData(cate_tag);
	var dst_dir = proj_path + '/' + cate_prefix + cate_tag;
	var dst_path = dst_dir + '/page-' + page_num + '.html';
	try {
		fs.mkdirSync(dst_dir);
	}
	catch (e) {
		if (e.code !== 'EEXIST') {
			throw e;
		}
	}
	var link_html = mustache.render(my_global.index.template.link_template, link_data);
	var main_html = mustache.render(my_global.index.template.main_template, main_data);
	var pagebar_html = mustache.render(my_global.index.template.pagebar_template, pagebar_data);
	var personal_html = mustache.render(my_global.index.template.personal_template, personal_data);
	var sidebar_html = mustache.render(my_global.index.template.sidebar_template, sidebar_data);
	
	// 不能直接操作原文，只能对副本进行操作
	var document = jsdom('');
	document.innerHTML = my_global.index.document.innerHTML;
	var window = document.parentWindow;
	
//	document.implementation.addFeature('FetchExternalResources', []);
//	document.implementation.addFeature('ProcessExternalResources', []);
//	document.implementation.addFeature('MutationEvents', []);
	
//	console.log(typeof document.getElementsByClassName('main-body')[0].appendChild);
	
	document.getElementsByClassName('main-body')[0].innerHTML = main_html;
	document.getElementsByClassName('sidebar-nav')[0].innerHTML = sidebar_html;
	document.getElementsByClassName('sidebar-links')[0].innerHTML = link_html;
	document.getElementsByClassName('personal')[0].innerHTML = personal_html;
	document.getElementsByClassName('pagebar')[0].innerHTML = pagebar_html;
	
	// 插入文章摘要
	var article_content = '';
	var start_index = 10 * (page_num - 1);
	var end_index = 10 * page_num;
	if (end_index > cate_artices.length) {
		end_index = cate_artices.length;
	}
	for (var i = start_index; i < end_index; i++) {
		var file = cate_artices[i];
		var abs_html = my_global.article[file].abstract_html;
		article_content += abs_html;

        //添加继续阅读
		article_content += "<br/>";
		article_content += "<p><a title=\"\" class=\"btn btn-primary pull-left\" href=\"/" + article_dir + '/' + file + ".html\">继续阅读  →</a> </p><br/> <br/>";
		article_content += "<div class=\"line_dashed\"></div>";
	}
	
	var selector = '.navbar-inner .nav li a[href="/' + cate_prefix + cate_tag + '/page-1.html"]';
	var element = document.querySelectorAll(selector)[0];
	element.parentNode.className = "active";
	//this.$('.navbar-inner .nav li a[href="#cate/' + this.cate + '"]').parent().addClass('active');
	
	document.getElementsByClassName('article-content')[0].innerHTML = article_content;
	
	var dels = document.getElementsByClassName('jsdom');
	for (var i = 0; i < dels.length; i++) {
		dels[0].parentNode.removeChild(dels[0]);
	}
	var del = document.getElementById('tpl-main');
	del.parentNode.removeChild(del);
	del = document.getElementById('tpl-sidebar');
	del.parentNode.removeChild(del);
	del = document.getElementById('tpl-person');
	del.parentNode.removeChild(del);
	del = document.getElementById('tpl-link');
	del.parentNode.removeChild(del);
	del = document.getElementById('tpl-pagebar');
	del.parentNode.removeChild(del);
	fs.writeFileSync(dst_path, document.innerHTML);
	console.log('写静态页面：' + dst_path + " 完成");
}

var index_load_timer = setInterval(function () {
	if ('undefined' !== typeof my_global.index.template) {
		// 已经加载首页模板并且解析完毕
		clearInterval(index_load_timer);
		
		var cates = my_global.cates;
		for (var cate_tag in cates) {
			if (cates.hasOwnProperty(cate_tag)) {
				var page_size = 10;
				var cate_artices = cates[cate_tag];
				var total_file_count = cate_artices.length;
				var total_page = Math.floor((total_file_count + page_size - 1) / page_size);
				for (var page_num = 1; page_num <= total_page; page_num++) {
					createPageView(cate_tag, total_page, page_num);
				}
			}
		}
		
		//复制首页
		var index_src_file = proj_path + '/' + cate_prefix + index_cate_tag + '/page-1.html';
		var index_dst_file = proj_path + '/index.html';
		var index_src_html = fs.readFileSync(index_src_file);
		fs.writeFileSync(index_dst_file, index_src_html);
		
		// 写具体页
		var articles = my_global.article;
		for (var article in articles) {
			if (articles.hasOwnProperty(article)) {
				createArticleView(article, articles[article]);
			}
		}
	}
}, 1);



