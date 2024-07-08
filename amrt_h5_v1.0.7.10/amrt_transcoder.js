var BASIS = ( function () {
    var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
    if ( typeof __filename !== 'undefined' ) _scriptDir = _scriptDir || __filename;
    return (
        function ( BASIS ) {
            BASIS = BASIS || {};

            var Module = typeof BASIS !== "undefined" ? BASIS : {};
            var readyPromiseResolve, readyPromiseReject;
            Module[ "ready" ] = new Promise( function ( resolve, reject ) {
                readyPromiseResolve = resolve;
                readyPromiseReject = reject
            } );
            var moduleOverrides = {};
            var key;
            for ( key in Module ) {
                if ( Module.hasOwnProperty( key ) ) {
                    moduleOverrides[ key ] = Module[ key ]
                }
            }
            var arguments_ = [];
            var thisProgram = "./this.program";
            var quit_ = function ( status, toThrow ) {
                throw toThrow
            };
            var ENVIRONMENT_IS_WEB = false;
            var ENVIRONMENT_IS_WORKER = false;
            var ENVIRONMENT_IS_NODE = false;
            var ENVIRONMENT_IS_SHELL = false;
            ENVIRONMENT_IS_WEB = typeof window === "object";
            ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
            ENVIRONMENT_IS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
            ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
            var scriptDirectory = "";

            function locateFile( path ) {
                if ( Module[ "locateFile" ] ) {
                    return Module[ "locateFile" ]( path, scriptDirectory )
                }
                return scriptDirectory + path
            }

            var read_, readAsync, readBinary, setWindowTitle;
            var nodeFS;
            var nodePath;
            if ( ENVIRONMENT_IS_NODE ) {
                if ( ENVIRONMENT_IS_WORKER ) {
                    scriptDirectory = require( "path" ).dirname( scriptDirectory ) + "/"
                } else {
                    scriptDirectory = __dirname + "/"
                }
                read_ = function shell_read( filename, binary ) {
                    if ( !nodeFS ) nodeFS = require( "fs" );
                    if ( !nodePath ) nodePath = require( "path" );
                    filename = nodePath[ "normalize" ]( filename );
                    return nodeFS[ "readFileSync" ]( filename, binary ? null : "utf8" )
                };
                readBinary = function readBinary( filename ) {
                    var ret = read_( filename, true );
                    if ( !ret.buffer ) {
                        ret = new Uint8Array( ret )
                    }
                    assert( ret.buffer );
                    return ret
                };
                if ( process[ "argv" ].length > 1 ) {
                    thisProgram = process[ "argv" ][ 1 ].replace( /\\/g, "/" )
                }
                arguments_ = process[ "argv" ].slice( 2 );
                process[ "on" ]( "uncaughtException", function ( ex ) {
                    if ( !( ex instanceof ExitStatus ) ) {
                        throw ex
                    }
                } );
                process[ "on" ]( "unhandledRejection", abort );
                quit_ = function ( status ) {
                    process[ "exit" ]( status )
                };
                Module[ "inspect" ] = function () {
                    return "[Emscripten Module object]"
                }
            } else if ( ENVIRONMENT_IS_SHELL ) {
                if ( typeof read != "undefined" ) {
                    read_ = function shell_read( f ) {
                        return read( f )
                    }
                }
                readBinary = function readBinary( f ) {
                    var data;
                    if ( typeof readbuffer === "function" ) {
                        return new Uint8Array( readbuffer( f ) )
                    }
                    data = read( f, "binary" );
                    assert( typeof data === "object" );
                    return data
                };
                if ( typeof scriptArgs != "undefined" ) {
                    arguments_ = scriptArgs
                } else if ( typeof arguments != "undefined" ) {
                    arguments_ = arguments
                }
                if ( typeof quit === "function" ) {
                    quit_ = function ( status ) {
                        quit( status )
                    }
                }
                if ( typeof print !== "undefined" ) {
                    if ( typeof console === "undefined" ) console = {};
                    console.log = print;
                    console.warn = console.error = typeof printErr !== "undefined" ? printErr : print
                }
            } else if ( ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER ) {
                if ( ENVIRONMENT_IS_WORKER ) {
                    scriptDirectory = self.location.href
                } else if ( typeof document !== "undefined" && document.currentScript ) {
                    scriptDirectory = document.currentScript.src
                }
                if ( _scriptDir ) {
                    scriptDirectory = _scriptDir
                }
                if ( scriptDirectory.indexOf( "blob:" ) !== 0 ) {
                    scriptDirectory = scriptDirectory.substr( 0, scriptDirectory.lastIndexOf( "/" ) + 1 )
                } else {
                    scriptDirectory = ""
                }
                {
                    read_ = function shell_read( url ) {
                        var xhr = new XMLHttpRequest;
                        xhr.open( "GET", url, false );
                        xhr.send( null );
                        return xhr.responseText
                    };
                    if ( ENVIRONMENT_IS_WORKER ) {
                        readBinary = function readBinary( url ) {
                            var xhr = new XMLHttpRequest;
                            xhr.open( "GET", url, false );
                            xhr.responseType = "arraybuffer";
                            xhr.send( null );
                            return new Uint8Array( xhr.response )
                        }
                    }
                    readAsync = function readAsync( url, onload, onerror ) {
                        var xhr = new XMLHttpRequest;
                        xhr.open( "GET", url, true );
                        xhr.responseType = "arraybuffer";
                        xhr.onload = function xhr_onload() {
                            if ( xhr.status == 200 || xhr.status == 0 && xhr.response ) {
                                onload( xhr.response );
                                return
                            }
                            onerror()
                        };
                        xhr.onerror = onerror;
                        xhr.send( null )
                    }
                }
                setWindowTitle = function ( title ) {
                    document.title = title
                }
            } else {
            }
            var out = Module[ "print" ] || console.log.bind( console );
            var err = Module[ "printErr" ] || console.warn.bind( console );
            for ( key in moduleOverrides ) {
                if ( moduleOverrides.hasOwnProperty( key ) ) {
                    Module[ key ] = moduleOverrides[ key ]
                }
            }
            moduleOverrides = null;
            if ( Module[ "arguments" ] ) arguments_ = Module[ "arguments" ];
            if ( Module[ "thisProgram" ] ) thisProgram = Module[ "thisProgram" ];
            if ( Module[ "quit" ] ) quit_ = Module[ "quit" ];
            var wasmBinary;
            if ( Module[ "wasmBinary" ] ) wasmBinary = Module[ "wasmBinary" ];
            var noExitRuntime;
            if ( Module[ "noExitRuntime" ] ) noExitRuntime = Module[ "noExitRuntime" ];
            if ( typeof WebAssembly !== "object" ) {
                abort( "no native wasm support detected" )
            }
            var wasmMemory;
            var ABORT = false;
            var EXITSTATUS;

            function assert( condition, text ) {
                if ( !condition ) {
                    abort( "Assertion failed: " + text )
                }
            }

            var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder( "utf8" ) : undefined;

            function UTF8ArrayToString( heap, idx, maxBytesToRead ) {
                var endIdx = idx + maxBytesToRead;
                var endPtr = idx;
                while ( heap[ endPtr ] && !( endPtr >= endIdx ) ) ++endPtr;
                if ( endPtr - idx > 16 && heap.subarray && UTF8Decoder ) {
                    return UTF8Decoder.decode( heap.subarray( idx, endPtr ) )
                } else {
                    var str = "";
                    while ( idx < endPtr ) {
                        var u0 = heap[ idx++ ];
                        if ( !( u0 & 128 ) ) {
                            str += String.fromCharCode( u0 );
                            continue
                        }
                        var u1 = heap[ idx++ ] & 63;
                        if ( ( u0 & 224 ) == 192 ) {
                            str += String.fromCharCode( ( u0 & 31 ) << 6 | u1 );
                            continue
                        }
                        var u2 = heap[ idx++ ] & 63;
                        if ( ( u0 & 240 ) == 224 ) {
                            u0 = ( u0 & 15 ) << 12 | u1 << 6 | u2
                        } else {
                            u0 = ( u0 & 7 ) << 18 | u1 << 12 | u2 << 6 | heap[ idx++ ] & 63
                        }
                        if ( u0 < 65536 ) {
                            str += String.fromCharCode( u0 )
                        } else {
                            var ch = u0 - 65536;
                            str += String.fromCharCode( 55296 | ch >> 10, 56320 | ch & 1023 )
                        }
                    }
                }
                return str
            }

            function UTF8ToString( ptr, maxBytesToRead ) {
                return ptr ? UTF8ArrayToString( HEAPU8, ptr, maxBytesToRead ) : ""
            }

            function stringToUTF8Array( str, heap, outIdx, maxBytesToWrite ) {
                if ( !( maxBytesToWrite > 0 ) ) return 0;
                var startIdx = outIdx;
                var endIdx = outIdx + maxBytesToWrite - 1;
                for ( var i = 0; i < str.length; ++i ) {
                    var u = str.charCodeAt( i );
                    if ( u >= 55296 && u <= 57343 ) {
                        var u1 = str.charCodeAt( ++i );
                        u = 65536 + ( ( u & 1023 ) << 10 ) | u1 & 1023
                    }
                    if ( u <= 127 ) {
                        if ( outIdx >= endIdx ) break;
                        heap[ outIdx++ ] = u
                    } else if ( u <= 2047 ) {
                        if ( outIdx + 1 >= endIdx ) break;
                        heap[ outIdx++ ] = 192 | u >> 6;
                        heap[ outIdx++ ] = 128 | u & 63
                    } else if ( u <= 65535 ) {
                        if ( outIdx + 2 >= endIdx ) break;
                        heap[ outIdx++ ] = 224 | u >> 12;
                        heap[ outIdx++ ] = 128 | u >> 6 & 63;
                        heap[ outIdx++ ] = 128 | u & 63
                    } else {
                        if ( outIdx + 3 >= endIdx ) break;
                        heap[ outIdx++ ] = 240 | u >> 18;
                        heap[ outIdx++ ] = 128 | u >> 12 & 63;
                        heap[ outIdx++ ] = 128 | u >> 6 & 63;
                        heap[ outIdx++ ] = 128 | u & 63
                    }
                }
                heap[ outIdx ] = 0;
                return outIdx - startIdx
            }

            function stringToUTF8( str, outPtr, maxBytesToWrite ) {
                return stringToUTF8Array( str, HEAPU8, outPtr, maxBytesToWrite )
            }

            function lengthBytesUTF8( str ) {
                var len = 0;
                for ( var i = 0; i < str.length; ++i ) {
                    var u = str.charCodeAt( i );
                    if ( u >= 55296 && u <= 57343 ) u = 65536 + ( ( u & 1023 ) << 10 ) | str.charCodeAt( ++i ) & 1023;
                    if ( u <= 127 ) ++len; else if ( u <= 2047 ) len += 2; else if ( u <= 65535 ) len += 3; else len += 4
                }
                return len
            }

            var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder( "utf-16le" ) : undefined;

            function UTF16ToString( ptr, maxBytesToRead ) {
                var endPtr = ptr;
                var idx = endPtr >> 1;
                var maxIdx = idx + maxBytesToRead / 2;
                while ( !( idx >= maxIdx ) && HEAPU16[ idx ] ) ++idx;
                endPtr = idx << 1;
                if ( endPtr - ptr > 32 && UTF16Decoder ) {
                    return UTF16Decoder.decode( HEAPU8.subarray( ptr, endPtr ) )
                } else {
                    var str = "";
                    for ( var i = 0; !( i >= maxBytesToRead / 2 ); ++i ) {
                        var codeUnit = HEAP16[ ptr + i * 2 >> 1 ];
                        if ( codeUnit == 0 ) break;
                        str += String.fromCharCode( codeUnit )
                    }
                    return str
                }
            }

            function stringToUTF16( str, outPtr, maxBytesToWrite ) {
                if ( maxBytesToWrite === undefined ) {
                    maxBytesToWrite = 2147483647
                }
                if ( maxBytesToWrite < 2 ) return 0;
                maxBytesToWrite -= 2;
                var startPtr = outPtr;
                var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
                for ( var i = 0; i < numCharsToWrite; ++i ) {
                    var codeUnit = str.charCodeAt( i );
                    HEAP16[ outPtr >> 1 ] = codeUnit;
                    outPtr += 2
                }
                HEAP16[ outPtr >> 1 ] = 0;
                return outPtr - startPtr
            }

            function lengthBytesUTF16( str ) {
                return str.length * 2
            }

            function UTF32ToString( ptr, maxBytesToRead ) {
                var i = 0;
                var str = "";
                while ( !( i >= maxBytesToRead / 4 ) ) {
                    var utf32 = HEAP32[ ptr + i * 4 >> 2 ];
                    if ( utf32 == 0 ) break;
                    ++i;
                    if ( utf32 >= 65536 ) {
                        var ch = utf32 - 65536;
                        str += String.fromCharCode( 55296 | ch >> 10, 56320 | ch & 1023 )
                    } else {
                        str += String.fromCharCode( utf32 )
                    }
                }
                return str
            }

            function stringToUTF32( str, outPtr, maxBytesToWrite ) {
                if ( maxBytesToWrite === undefined ) {
                    maxBytesToWrite = 2147483647
                }
                if ( maxBytesToWrite < 4 ) return 0;
                var startPtr = outPtr;
                var endPtr = startPtr + maxBytesToWrite - 4;
                for ( var i = 0; i < str.length; ++i ) {
                    var codeUnit = str.charCodeAt( i );
                    if ( codeUnit >= 55296 && codeUnit <= 57343 ) {
                        var trailSurrogate = str.charCodeAt( ++i );
                        codeUnit = 65536 + ( ( codeUnit & 1023 ) << 10 ) | trailSurrogate & 1023
                    }
                    HEAP32[ outPtr >> 2 ] = codeUnit;
                    outPtr += 4;
  