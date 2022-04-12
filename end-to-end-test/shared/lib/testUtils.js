var assert = require('assert');

module.exports = {
    assertScreenShotMatch(result, message) {
        if (result[0].referenceExists === false) {
            assert.fail('Missing reference screenshot');
        } else {
            assert(result[0].isWithinMisMatchTolerance, message);
        }
    },
    // TODO: move to specUtils
    getNthOncoprintTrackOptionsElements(n) {
        // n is one-indexed

        const button_selector =
            '#oncoprintDiv .oncoprintjs__track_options__toggle_btn_img.nth-' +
            n;
        const dropdown_selector =
            '#oncoprintDiv .oncoprintjs__track_options__dropdown.nth-' + n;

        return {
            button: $(button_selector),
            button_selector,
            dropdown: $(dropdown_selector),
            dropdown_selector,
        };
    },
};
