$(function() {
    KMA.init();
    $(window).resize(function() {
        KMA.modalRefresh()
    });
    KMA.modalRefresh();
    $(document).on("click", "[modal]", function() {
        var modalWindow = $("div#" + $(this).attr("modal"));
        if (modalWindow.length) {
            KMA.modalShow(modalWindow);
            return false
        }
    }).on("click", ".icon-close, .modal, .button-close", function(event) {
        event.preventDefault();
        if (event.target != this) {
            return false
        } else {
            KMA.modalHide($(this).closest(".modal"))
        }
    }).on("keydown", function(key) {
        if (key.keyCode == 27) KMA.modalHide($(".modal:visible:last"))
    }).on("click", ".modal > *", function(event) {
        event.stopPropagation();
        return true
    });
    $("#kmacb-form form").on("submit", function(event) {
        event.preventDefault();
        var form = $("form:first"),
            form_from_popup = form.find("input[name=frompopup]");
        var datarow = $(this).serializeArray();
        $(datarow).each(function(item, itemData) {
            try {
                form.find("[name=" + itemData.name + "]").val(itemData.value)
            } catch (err) {}
        });
        form_from_popup.val("1");
        form.trigger("submit", true).trigger("reset")
    });
    if ($("#kmacb-form-append").length && $("#kmacb-form form").length) {
        $("#kmacb-form form").prepend($("#kmacb-form-append").html());
        $("#kmacb-form-append").remove()
    }
    $("form").append('<input type="hidden" name="jswork" value="1" />');
    $("form").append('<input type="hidden" name="frompopup" value="0" />')
});
var KMA = function($, $n) {
    return $.extend($n, {
        init: function() {
            this.initFireMetric();
            this.setTimezone();
            this.initDataCountry();
            this.initMethodForm();
            this.checkPhoneLen();
            this.initAgreement();
            this.initTranslate()
        },
        modalHide: function($modal) {
            $modal.fadeOut("fast", function() {
                if (!$(".modal:visible").length) {
                    $("body").removeClass("modal-show");
                    $(document).trigger("kma.modal-hide")
                }
            })
        },
        modalRefresh: function() {
            if ($(".modal:visible:last").length) {
                var modalBlock = $(".modal:visible:last .modal-block"),
                    width = parseInt(modalBlock.outerWidth()),
                    height = parseInt(modalBlock.outerHeight());
                if ($(window).height() > height + 20) {
                    modalBlock.addClass("modal-top").removeClass("margin-t-b").css("margin-top", -1 * (height / 2))
                } else {
                    modalBlock.addClass("margin-t-b").removeClass("modal-top")
                }
                if ($(window).width() > width) {
                    modalBlock.addClass("modal-left").removeClass("margin-l").css("margin-left", -1 * (width / 2))
                } else {
                    modalBlock.addClass("margin-l").removeClass("modal-left")
                }
            }
        },
        modalShow: function($modal) {
            $modal.fadeIn("fast");
            $("body").addClass("modal-show");
            $(document).trigger("kma.modal-show");
            this.modalRefresh()
        },
        initCallback: function(timeout) {
            try {
                $("#kmacb > a").on("click", function(event, disableTrigger) {
                    if (disableTrigger == undefined || !disableTrigger) {
                        $(this).trigger("kma.callbackOperator")
                    }
                });
                if (window.kmacb_manager_class != undefined) {
                    $("#kmacb").addClass(window.kmacb_manager_class)
                }
                if (window.kmacb_form_selector != undefined) {
                    $("#kmacb > a").attr("kmacb-custom-form", window.kmacb_form_selector);
                    $("#kmacb > a").on("click", function(event, disableTrigger) {
                        event.preventDefault();
                        event.stopPropagation();
                        $(window.kmacb_form_selector).trigger("click", [true, true])
                    });
                    $(window.kmacb_form_selector).on("click", function(event, disableTrigger) {
                        if (disableTrigger == undefined || !disableTrigger) {
                            $(document).trigger("kma.callbackButton")
                        }
                    })
                }
                setTimeout(function start_kmacb() {
                    $("#kmacb").show()
                }, timeout)
            } catch (e) {}
        },
        setTimezone: function() {
            var tz = (new Date).getTimezoneOffset();
            $("form").append('<input type="hidden" name="timezone" value="' + tz + '" />')
        },
        setCountryField: function(country) {},
        checkAndSetCountryField: function(country) {
            if (!$("select[name=country]").length && !$("input[name=country]").length) {
                this.setCountryField(country)
            }
        },
        disableCountrySelect: function(country) {
            if ($("select[name=country]").length) {
                $("select[name=country]").attr("disabled", "disabled");
                this.setCountryField(country)
            }
        },
        showComebacker: false,
        initComebacker: function(timeout) {
            var current = this;
            current.showComebacker = true;
            try {
                setTimeout(function start_kmacomebacker() {
                    var comebacker = true;
                    $(window).on("mouseout", function(event) {
                        if (event.pageY - $(window).scrollTop() < 1 && comebacker) {
                            if (window.customPopupShowed != undefined && window.customPopupShowed === true) {
                                return
                            }
                            if ($(".modal:visible").length) {
                                return
                            }
                            $(document).trigger("kma.mouseLeave");
                            $("#kmacb > a").trigger("click", [true]);
                            comebacker = false
                        }
                    })
                }, timeout)
            } catch (e) {}
        },
        phoneMaxLen: 25,
        checkPhoneLen: function() {
            var current = this;
            try {
                if (window.phone_max_length != undefined && window.phone_max_length != "") {
                    current.phoneMaxLen = parseInt(window.phone_max_length)
                }
            } catch (err) {}
            $(document).on("keypress", "input[name=phone]", function(e) {
                var reg1 = new RegExp("[^0-9]*", "g"),
                    phone_txt = $(this).val().replace(reg1, "");
                if (phone_txt.length >= current.phoneMaxLen) {
                    e.preventDefault()
                }
            })
        },
        validateAndSendForm: function(jsonRequest, KMAText) {
            var current = this;
            $(document).on("submit", "form", function(e, isKMACb) {
                if (!$(this).closest("#kmacb-form").length) {
                    if (jsonRequest) {
                        current.prepareJsonData($(this))
                    }
                    $("input[name=name]", this).val($.trim($("input[name=name]", this).val()));
                    if (!$("input[name=name]", this).val()) {
                        alert(KMAText["validation_name"]);
                        return false
                    }
                    var phone_val = $("input[name=phone]", this).val(),
                        reg1 = new RegExp("[^0-9]*", "g"),
                        reg2 = new RegExp("[^0-9-+ ()]", "g"),
                        phone_txt = phone_val.replace(reg1, "");
                    if (phone_val.search(reg2) != -1) {
                        alert(KMAText["validation_phone1"]);
                        return false
                    }
                    if (!phone_txt || phone_txt.length < 9) {
                        alert(KMAText["validation_phone2"]);
                        return false
                    }
                    if (phone_txt.length && phone_txt.length > current.phoneMaxLen) {
                        alert(KMAText["validation_phone3"]);
                        return false
                    }
                    current.showComebackerAlert = false;
                    if (!isKMACb) {
                        try {
                            var yaCounterID = $(this).attr("data-kma-yacounter-id-important") == undefined ? $(this).attr("data-kma-yacounter-id") : $(this).attr("data-kma-yacounter-id-important"),
                                yaCounterGoal = $(this).attr("data-kma-yacounter-goal-important") == undefined ? $(this).attr("data-kma-yacounter-goal") : $(this).attr("data-kma-yacounter-goal-important");
                            if (yaCounterID != undefined && yaCounterGoal != undefined) {
                                yaCounterID = yaCounterID.trim();
                                yaCounterGoal = yaCounterGoal.trim();
                                if (yaCounterID != "" && yaCounterGoal != "") {
                                    window["yaCounter" + yaCounterID].reachGoal(yaCounterGoal)
                                }
                                if (window.metricDebug === true) {
                                    console.log(yaCounterID, yaCounterGoal)
                                }
                            }
                        } catch (err) {
                            console.log("Exception: Yandex Metrica - yaCounter")
                        }
                        try {
                            var gaGoal = $(this).attr("data-kma-ga-goal"),
                                gaGoalCategory = $(this).attr("data-kma-ga-goal-category");
                            if (gaGoal != undefined) {
                                gaGoal = gaGoal.trim();
                                if (typeof gtag === "function") {
                                    gtag("event", gaGoal, gaGoalCategory ? {
                                        event_category: gaGoalCategory
                                    } : {})
                                } else {
                                    ga("send", gaGoal, gaGoalCategory ? {
                                        eventCategory: gaGoalCategory
                                    } : {})
                                }
                            }
                            if (window.kma_order_ga_params != undefined) {
                                if (typeof gtag === "function") {
                                    gtag("event", gaGoal, gaGoalCategory ? {
                                        event_category: gaGoalCategory
                                    } : {})
                                } else {
                                    ga("send", gaGoal, gaGoalCategory ? {
                                        eventCategory: gaGoalCategory
                                    } : {})
                                }
                            }
                            if (window.metricDebug === true) {
                                console.log(gaGoal, gaGoalCategory)
                            }
                        } catch (err) {
                            console.log("Exception: Google Analitics - send event")
                        }
                    } else {
                        $("#kmacb-form form").trigger("kma.cbform-validate")
                    }
                    $(this).trigger("kma.form-validate");
                    return true
                }
            });
            $("a.order-btn").click(function() {
                $(this).closest("form").submit();
                return false
            })
        },
        prepareJsonData: function(form) {
            var datarow = form.serializeArray();
            var addressIsset = false;
            $(datarow).each(function(item, itemData) {
                if (itemData.name == "address") {
                    addressIsset = true
                }
                if (itemData.name == "name" || itemData.name == "phone" || itemData.name == "address" || itemData.name == "client_data") {
                    delete datarow[item]
                }
            });
            if (addressIsset == false) {
                form.append("<input type='hidden' name='address' />")
            }
            form.find("input[name='address']").val($.JSON.encode(datarow))
        },
        initVibrate: function(timeout) {
            setInterval(function() {
                try {
                    if (window.navigator && window.navigator.vibrate) {
                        navigator.vibrate([50, 30, 100, 30, 100, 30, 100, 30, 100, 30, 100, 30, 100, 30, 100, 30, 100, 30, 100, 30])
                    } else {
                        navigator.vibrate(0)
                    }
                } catch (err) {}
            }, timeout)
        },
        showComebackerAlert: true,
        initComebackerAlert: function(KMAText) {
            var current = this;
            window.onbeforeunload = function(evt) {
                if (current.showComebackerAlert) {
                    current.showComebackerAlert = false;
                    $("form").append('<input type="hidden" name="aftercomebacker" value="1" />');
                    return KMAText["comebacker_text"]
                }
            }
        },
        showNewsBlogIframe: true,
        funcNewsBlogIframe: function(KMAText, url) {
            var current = this;
            if (current.showNewsBlogIframe) {
                current.showNewsBlogIframe = false;
                $("body").css({
                    overflow: "hidden",
                    background: "#FFF"
                }).html('<iframe src="' + url + '" id="comebacker_smi" style="position:fixed;border:none;top:0;left:0;right:0;bottom:0;width:100%;height:100%;z-index:9999999999;"></iframe>');
                return KMAText["comebacker_text"]
            }
        },
        initNewsBlogIframe: function(KMAText, url, secWait) {
            var current = this;
            var idleTimer = null,
                idleWait = parseInt(secWait) * 1e3;
            $(document).on("mousemove keydown scroll", function() {
                clearTimeout(idleTimer);
                idleTimer = setTimeout(function() {
                    current.funcNewsBlogIframe(KMAText, url)
                }, idleWait)
            });
            $("body").trigger("mousemove")
        },
        initRedirectAfterSomeSeconds: function(url, secWait) {
            var idleTimer = null,
                idleWait = parseInt(secWait) * 1e3;
            $(document).on("mousemove keydown scroll", function() {
                clearTimeout(idleTimer);
                idleTimer = setTimeout(function() {
                    window.location.href = url
                }, idleWait)
            })
        },
        initDataCountry: function() {
            var current = this;
            current.changeDataCountry(window.country);
            current.changeDataNotCountry(window.country);
            $(".country_select").change(function() {
                current.changeDataCountry($(this).val());
                current.changeDataNotCountry($(this).val())
            })
        },
        eur: ["AT", "BG", "GB", "HU", "DE", "GR", "ES", "IT", "CY", "MK", "NL", "PL", "PT", "RO", "RS", "SK", "SI", "TR", "FR", "HR", "CZ", "CH", "BE", "IL", "LV", "LT", "LU", "NO", "SE", "EE"],
        sng: ["RU", "UA", "BY", "KZ", "MD", "KG", "UZ", "AZ", "AM", "TJ", "TM", "GE", "UZ"],
        afr: ["NG"],
        changeDataCountry: function(country) {
            var current = this;
            $.each($("[data-kma-country]"), function() {
                var country_str = $(this).attr("data-kma-country").split(" ").join("").toUpperCase(),
                    country_arr = country_str.split(","),
                    change_class = $(this).is("[data-kma-class]") ? $(this).attr("data-kma-class") : undefined,
                    geo_area = undefined;
                if (current.sng.indexOf(country) > -1) {
                    geo_area = "SNG"
                } else if (current.eur.indexOf(country) > -1) {
                    geo_area = "EUR"
                } else if (current.afr.indexOf(country) > -1) {
                    geo_area = "AFR"
                } else geo_area = "ASIA";
                if (country_arr.indexOf(country) > -1 || geo_area != undefined && country_arr.indexOf(geo_area) > -1) {
                    if (change_class != undefined) {
                        $(this).addClass(change_class)
                    } else {
                        $(this).show()
                    }
                } else {
                    if (change_class != undefined) {
                        $(this).removeClass(change_class)
                    } else {
                        $(this).hide()
                    }
                }
            })
        },
        changeDataNotCountry: function(country) {
            var current = this;
            $.each($("[data-kma-not-country]"), function() {
                var country_str = $(this).attr("data-kma-not-country").split(" ").join("").toUpperCase(),
                    country_arr = country_str.split(","),
                    geo_area = undefined;
                if (current.sng.indexOf(country) > -1) {
                    geo_area = "SNG"
                } else if (current.eur.indexOf(country) > -1) {
                    geo_area = "EUR"
                } else if (current.afr.indexOf(country) > -1) {
                    geo_area = "AFR"
                } else geo_area = "ASIA";
                if (country_arr.indexOf(country) > -1 || geo_area != undefined && country_arr.indexOf(geo_area) > -1) {
                    $(this).hide()
                } else {
                    $(this).show()
                }
            })
        },
        initAgreement: function() {
            if (!$("[modal=agreement]").length) {
                var $polit = $("[modal=polit]:visible:last"),
                    $agreement = $polit.clone();
                $polit.after($agreement.attr("modal", "agreement").text("Пользовательское соглашение"));
                $polit.after("<br>")
            }
        },
        ruLangList: ["ru", "az", "be", "kk", "uk", "ka", "uz", "ky", "am", "tg"],
        initTranslate: function() {
            var current = this,
                $agreement = $("[modal=agreement]:visible:last"),
                $policy = $("[modal=polit]:visible:last");
            if ($agreement.length) {
                if (current.ruLangList.indexOf(window.lang.toLowerCase()) > -1) {
                    $agreement.text("Пользовательское соглашение")
                } else {
                    $agreement.text("User Agreement")
                }
            }
            if ($policy.length) {
                if (current.ruLangList.indexOf(window.lang.toLowerCase()) > -1) {
                    $policy.text("Политика конфиденциальности")
                } else {
                    $policy.text("Privacy Policy")
                }
            }
        },
        initMethodForm: function() {
            $("form").attr("method", "POST")
        },
        fireMetric: function(target) {
            var ym_id = undefined;
            var ym_goal = undefined;
            var ga_goal = undefined;
            var ga_goal_cat = undefined;
            if (typeof $(target).attr("data-goal") !== "undefined") {
                ym_goal = ga_goal = $(target).attr("data-goal")
            } else {
                ym_goal = $(target).attr("data-ym-goal");
                ga_goal = $(target).attr("data-ga-goal")
            }
            ga_goal_cat = $(target).attr("data-ga-goal-cat");
            ym_id = $(target).attr("data-ym-id");
            if (window.metricDebug === true) {
                console.log(ym_id, ym_goal, ga_goal, ga_goal_cat)
            }
            try {
                if (typeof ym_id !== undefined && typeof ym_goal !== undefined) {
                    $.globalEval("yaCounter" + ym_id + ".reachGoal('" + ym_goal + "');")
                }
                if (typeof ga_goal !== undefined) {
                    if (typeof gtag === "function") {
                        gtag("event", ga_goal, ga_goal_cat ? {
                            event_category: ga_goal_cat
                        } : {})
                    } else {
                        ga("send", ga_goal, ga_goal_cat ? {
                            eventCategory: ga_goal_cat
                        } : {})
                    }
                }
            } catch (e) {
                if (window.metricDebug === true) {
                    console.log("metric doesnt install", e)
                }
            }
        },
        initFireMetric: function() {
            var current = this;
            $(document).on("click", "[data-trigger=click]", function(e, disableTrigger, generateByCB) {
                if (!generateByCB) {
                    current.fireMetric(this)
                }
            });
            $(document).on("submit", "[data-trigger=submit]:not([data-kma-yacounter-id]):not([data-kma-ga-goal])", function() {
                if ($(this).parents("#kmacb-form").length) return true;
                current.fireMetric(this);
                return false
            });
            $(document).on("kma.cbform-validate", function(e) {
                if ($(e.target).attr("data-trigger") === "submit") current.fireMetric(e.target);
                return false
            });
            $(document).on("kma.callbackOperator", function(e) {
                if ($(e.target).attr("data-trigger") === "click") {
                    current.fireMetric(e.target)
                }
            })
        },
        change_country: function(id) {}
    })
}(jQuery, KMA || {});

