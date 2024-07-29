#[macro_export]
macro_rules! lock_and_call {
    ($var:expr, $func:ident, $( $arg:expr ),* ) => {
        {
            let mut locked_var = $var.data.lock().unwrap();
            locked_var.$func($($arg),*);
        }
    };
}