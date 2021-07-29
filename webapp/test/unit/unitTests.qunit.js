/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"pampa/comunicacionesformales/contratos/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});