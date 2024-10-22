"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nj_westOrangeCodey = nj_westOrangeCodey;
var database_1 = require("@/libs/database");
var client_1 = require("@prisma/client");
function nj_westOrangeCodey() {
    return __awaiter(this, void 0, void 0, function () {
        var startDate, endDate, url, response, data, eventTypeMap, rink, softDeleteResult, createdCount, _i, data_1, event_1, iceTimeType, error_1, remainingActiveRecords;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startDate = new Date().toISOString().split('T')[0];
                    endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    url = "https://essexcountyparks.org/calendar.json/location/65?start=".concat(startDate, "&end=").concat(endDate);
                    console.log("Fetching data from:", url);
                    return [4 /*yield*/, fetch(url)];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP error! status: ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    console.log("Data fetched successfully");
                    eventTypeMap = {
                        "Codey Arena Public Session Skating": client_1.IceTimeTypeEnum.OPEN_SKATE,
                        "Codey Arena - Learn to Skate Class": client_1.IceTimeTypeEnum.LEARN_TO_SKATE,
                        "Codey Arena Adult 35+ Skating Session": client_1.IceTimeTypeEnum.ADULT_SKATE,
                        // Add more mappings as needed
                    };
                    return [4 /*yield*/, database_1.prisma.rink.findUnique({
                            where: { name: "Codey Arena" },
                        })];
                case 3:
                    rink = _a.sent();
                    if (!rink) {
                        throw new Error("Rink not found");
                    }
                    return [4 /*yield*/, database_1.prisma.iceTime.updateMany({
                            where: {
                                rinkId: rink.id,
                                deleted: false,
                            },
                            data: {
                                deleted: true,
                            },
                        })];
                case 4:
                    softDeleteResult = _a.sent();
                    console.log("Soft deleted ".concat(softDeleteResult.count, " existing records"));
                    createdCount = 0;
                    _i = 0, data_1 = data;
                    _a.label = 5;
                case 5:
                    if (!(_i < data_1.length)) return [3 /*break*/, 10];
                    event_1 = data_1[_i];
                    iceTimeType = eventTypeMap[event_1.title] || client_1.IceTimeTypeEnum.OTHER;
                    _a.label = 6;
                case 6:
                    _a.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, database_1.prisma.iceTime.create({
                            data: {
                                type: iceTimeType,
                                originalIceType: event_1.title,
                                date: new Date(event_1.start.split(' ')[0]),
                                startTime: event_1.start.split(' ')[1],
                                endTime: event_1.end.split(' ')[1],
                                rinkId: rink.id,
                                deleted: false,
                            },
                        })];
                case 7:
                    _a.sent();
                    createdCount++;
                    return [3 /*break*/, 9];
                case 8:
                    error_1 = _a.sent();
                    console.error("Error creating IceTime record:", error_1);
                    console.error("Problematic event data:", event_1);
                    return [3 /*break*/, 9];
                case 9:
                    _i++;
                    return [3 /*break*/, 5];
                case 10:
                    console.log("Successfully created ".concat(createdCount, " new IceTime records"));
                    return [4 /*yield*/, database_1.prisma.iceTime.count({
                            where: {
                                rinkId: rink.id,
                                deleted: false,
                                date: {
                                    lt: new Date(data[0].start.split(' ')[0]), // Check for records older than the earliest new event
                                },
                            },
                        })];
                case 11:
                    remainingActiveRecords = _a.sent();
                    if (remainingActiveRecords > 0) {
                        console.warn("Found ".concat(remainingActiveRecords, " active records that weren't soft deleted. Manual check may be required."));
                    }
                    return [2 /*return*/, {
                            message: "Processed ".concat(data.length, " events. Soft deleted ").concat(softDeleteResult.count, " records. Created ").concat(createdCount, " new records."),
                            remainingActiveRecords: remainingActiveRecords
                        }];
            }
        });
    });
}
