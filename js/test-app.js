var client      = new Dropbox.Client({ key: YOUR_DROPBOX_APP_KEY }),
    TodosApp    = TodosApp || {
    
    /**
     * Holder for the list of records retrieved
     *
     * @var     Array
     */
    todosList: null,
    
    /**
     * Application initializer method
     *
     * @return  void
     */
    initialize: function() {
        // Try and authenticate the client, without redirecting the user
        client.authenticate({
            interactive: false
        }, function( error, response ) {
            if ( error ) {
                console.log( 'OAuth error: ' + error );
            }
        });
        
        // We now check if the client is already authenticated
        TodosApp.checkClient();
        TodosApp.listenChooser();
    },
    
    /**
     * Verify if the Dropbox user is authenticated, if so we retrieve her data and show the according interface,
     * if not we display the interface allowing her to authenticate
     *
     * @return  void
     */
    checkClient: function() {
        if ( client.isAuthenticated() ) {
            $( '#link-button' ).fadeOut();
            $( '#main' ).fadeIn();
            
            // We have an authenticated user, retrieve our datastore
            client.getDatastoreManager().openDefaultDatastore( function( error, Datastore ) {
                if ( error ) {
                    console.log( 'Datastore error: ' + error );
                }
                todosList   = Datastore.getTable( 'todos' );
                
                TodosApp.updateTodos();
                Datastore.recordsChanged.addListener( TodosApp.updateTodos );
            });
            
            // We also want to append the listener to the form to create todos
            $( '#add-todo' ).submit( TodosApp.createTodo );
        } else {
            $( '#main' ).fadeOut();
            
            $( '#link-button' ).click( function() {
                client.authenticate();
            });
        }
    },
    
    /**
     * Method used to create a new todo in the datastore
     *
     * @return  void
     */
    createTodo: function( e ) {
        e.preventDefault();
        
        var todoInput   = $( '#todo' ),
            content     = todoInput.val();
        if ( content.length <= 0 ) {
            alert( 'Invalid TODO' );
        } else {
            todosList.insert({
                todo: content,
                created: new Date(),
                completed: false
            });
            todoInput.val( '' );
        }
    },
    
    /**
     * Check for the event when the user has selected a Dropbox file
     *
     * @return  void
     */
    listenChooser: function() {
        document.getElementById( 'dp-chooser' ).addEventListener( 'DbxChooserSuccess', function( e ) {
            $( '#selected-image' ).attr( 'src', e.files[0].link ).fadeIn();
        }, false );
    },
    
    /**
     * Update the information displayed in the todos list
     *
     * @return  void
     */
    updateTodos: function() {
        var list    = $( '#todos' ),
            records = todosList.query();
        
        list.empty();
        
        for ( var i = 0; i < records.length; i++ ) {
            var record  = records[i],
                el      = $( '<li>' ).attr( 'data-record-id', record.getId() ).append(
                            $( '<button>' ).html( '&times;' )
                        ).append(
                            $( '<input type="checkbox" name="completed" class="task_completed" >' )
                        ).append(
                            $( '<span>' ).html( record.get( 'todo' ) )
                        ).addClass( record.get( 'completed' ) ? 'completed' : '' );
                list.append( el );
                
                if ( record.get( 'completed' ) ) {
                    $( 'input', el ).attr( 'checked', 'checked' );
                }
        }
        
        $( 'li button' ).click( function( e ) {
            e.preventDefault();
            
            var id  = $( this ).parents( 'li' ).attr( 'data-record-id' );
            todosList.get( id ).deleteRecord();
        });
        $( 'li input' ).click( function( e ) {
            var el  = $( e.target ),
                id  = el.parents( 'li' ).attr( 'data-record-id' );
            
            todosList.get( id ).set( 'completed', el.is( ':checked' ) );
        });
    }
};

$( 'document' ).ready( TodosApp.initialize );